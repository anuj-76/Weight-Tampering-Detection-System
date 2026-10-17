from machine import Pin, I2C, ADC
import time
import struct
from pico_i2c_lcd import I2cLcd

# ==========================
# HX711 (UNCHANGED - WORKING)
# ==========================
DT = Pin(16, Pin.IN)
SCK = Pin(17, Pin.OUT)

BASE = -326230
SCALE = 277.0

zero_offset = BASE
filtered_weight = 0

alpha_up = 0.7
alpha_down = 0.3


def read_hx():
    timeout = time.ticks_ms()
    while DT.value() == 1:
        if time.ticks_diff(time.ticks_ms(), timeout) > 1000:
            return None

    count = 0
    for _ in range(24):
        SCK.value(1)
        count <<= 1
        SCK.value(0)
        if DT.value():
            count += 1

    SCK.value(1)
    SCK.value(0)

    if count & 0x800000:
        count -= 0x1000000

    return count


def read_weight():
    global filtered_weight

    total = 0
    valid = 0

    for _ in range(6):
        v = read_hx()
        if v is not None:
            total += v
            valid += 1

    if valid == 0:
        return 0

    raw = total / valid
    weight = (raw - zero_offset) / SCALE

    if abs(weight) < 0.5:
        weight = 0

    alpha = alpha_up if weight > filtered_weight else alpha_down
    filtered_weight = (alpha * weight) + ((1 - alpha) * filtered_weight)

    if filtered_weight < 0.3:
        filtered_weight = 0

    return filtered_weight


# ==========================
# BUTTONS
# ==========================
RESET_BTN = Pin(3, Pin.IN, Pin.PULL_UP)
DEBUG_BTN = Pin(5, Pin.IN, Pin.PULL_UP)
CYCLE_BTN = Pin(7, Pin.IN, Pin.PULL_UP)

# ==========================
# OUTPUTS
# ==========================
BUZZER = Pin(13, Pin.OUT)
GREEN = Pin(14, Pin.OUT)
RED = Pin(15, Pin.OUT)

TAMPER_WIRE = Pin(21, Pin.IN, Pin.PULL_UP)

# ==========================
# ANALOG
# ==========================
LDR = ADC(Pin(26))
VOLT = ADC(Pin(27))

# ==========================
# I2C + LCD
# ==========================
i2c = I2C(0, sda=Pin(0), scl=Pin(1), freq=100000)

lcd = None
if 0x27 in i2c.scan():
    lcd = I2cLcd(i2c, 0x27, 2, 16)

MPU_ADDR = 0x68
QMC_ADDR = 0x0D

i2c.writeto_mem(MPU_ADDR, 0x6B, b'\x00')
i2c.writeto_mem(QMC_ADDR, 0x09, b'\x1D')

# ==========================
# THRESHOLDS (FIXED)
# ==========================
MOTION_TH = 3000
MAG_DELTA = 2000     # 🔥 change detection instead of absolute
LDR_DELTA = 8000     # 🔥 light change detection
VOLT_LOW = 0.5
VOLT_HIGH = 2.8

# ==========================
# BASELINES
# ==========================
base_ax = base_ay = base_az = 0
base_mx = base_my = base_mz = 0
base_ldr = 0

# ==========================
# STATE
# ==========================
tamper_active = False
tamper_start = 0
tamper_list = []

debug_mode = False
debug_index = 0
debug_sensors = ["LDR", "MAG", "VOLT", "MOTION", "LOAD"]

last_lcd1 = ""
last_lcd2 = ""


# ==========================
# LCD
# ==========================
def show_lcd(l1, l2):
    global last_lcd1, last_lcd2

    if not lcd:
        return

    if l1 != last_lcd1:
        lcd.move_to(0, 0)
        lcd.putstr(l1[:16] + " " * (16 - len(l1[:16])))
        last_lcd1 = l1

    if l2 != last_lcd2:
        lcd.move_to(0, 1)
        lcd.putstr(l2[:16] + " " * (16 - len(l2[:16])))
        last_lcd2 = l2


# ==========================
# SENSOR READ
# ==========================
def read_mpu():
    data = i2c.readfrom_mem(MPU_ADDR, 0x3B, 6)
    return struct.unpack(">hhh", data)


def read_qmc():
    data = i2c.readfrom_mem(QMC_ADDR, 0x00, 6)

    x = data[1] << 8 | data[0]
    y = data[3] << 8 | data[2]
    z = data[5] << 8 | data[4]

    if x > 32767: x -= 65536
    if y > 32767: y -= 65536
    if z > 32767: z -= 65536

    return x, y, z


# ==========================
# CALIBRATION (CRITICAL FIX)
# ==========================
def calibrate_all():
    global base_ax, base_ay, base_az
    global base_mx, base_my, base_mz
    global base_ldr, zero_offset, filtered_weight

    show_lcd("CALIBRATING", "DON'T TOUCH")

    sx = sy = sz = 0
    smx = smy = smz = 0
    sldr = 0

    for _ in range(30):
        try:
            ax, ay, az = read_mpu()
            mx, my, mz = read_qmc()
        except:
            ax = ay = az = 0
            mx = my = mz = 0

        sx += ax; sy += ay; sz += az
        smx += mx; smy += my; smz += mz
        sldr += LDR.read_u16()

        time.sleep(0.05)

    base_ax = sx // 30
    base_ay = sy // 30
    base_az = sz // 30

    base_mx = smx // 30
    base_my = smy // 30
    base_mz = smz // 30

    base_ldr = sldr // 30

    # HX711 tare
    total = 0
    count = 0
    for _ in range(20):
        v = read_hx()
        if v is not None:
            total += v
            count += 1

    if count > 0:
        zero_offset = total / count

    filtered_weight = 0

    show_lcd("DONE", "")
    time.sleep(1)


# ==========================
# START
# ==========================
show_lcd("TAMPER GUARD", "START")
time.sleep(1)
calibrate_all()

# ==========================
# MAIN LOOP
# ==========================
while True:

    if RESET_BTN.value() == 0:
        time.sleep(0.3)
        calibrate_all()
        tamper_active = False

    if DEBUG_BTN.value() == 0:
        time.sleep(0.3)
        debug_mode = not debug_mode

    try:
        ax, ay, az = read_mpu()
        mx, my, mz = read_qmc()
    except:
        ax = ay = az = 0
        mx = my = mz = 0

    ldr_val = LDR.read_u16()
    volt_val = (VOLT.read_u16() / 65535) * 3.3
    weight = read_weight()

    # 🔥 FULL PRINT
    print("AX:", ax, "AY:", ay, "AZ:", az,
          "| MX:", mx, "MY:", my, "MZ:", mz,
          "| LDR:", ldr_val,
          "| VOLT:", round(volt_val, 2),
          "| W:", round(weight, 1),
          "| WIRE:", TAMPER_WIRE.value())

    # ==========================
    # TAMPER DETECTION (FIXED)
    # ==========================
    tamper_now = []

    # MOTION
    if (abs(ax - base_ax) > MOTION_TH or
        abs(ay - base_ay) > MOTION_TH or
        abs(az - base_az) > MOTION_TH):
        tamper_now.append("TILT")

    # MAGNET (DELTA BASED)
    if (abs(mx - base_mx) > MAG_DELTA or
        abs(my - base_my) > MAG_DELTA or
        abs(mz - base_mz) > MAG_DELTA):
        tamper_now.append("MAG")

    # LDR (LIGHT CHANGE)
    if abs(ldr_val - base_ldr) > LDR_DELTA:
        tamper_now.append("LIGHT")

    # VOLT
    if volt_val < VOLT_LOW or volt_val > VOLT_HIGH:
        tamper_now.append("VOLT")

    # WIRE
    if TAMPER_WIRE.value():
        tamper_now.append("WIRE")

    # ==========================
    # TAMPER ACTION
    # ==========================
    if tamper_now:
        tamper_active = True
        tamper_list = tamper_now
        tamper_start = time.ticks_ms()

    if tamper_active:
        RED.on()
        GREEN.off()
        BUZZER.on()

        show_lcd("TAMPER!", ",".join(tamper_list))

        if time.ticks_diff(time.ticks_ms(), tamper_start) > 10000:
            tamper_active = False

    else:
        RED.off()
        GREEN.on()
        BUZZER.off()
        show_lcd("WEIGHT", "{:.1f} g".format(weight))

    time.sleep(0.08)
