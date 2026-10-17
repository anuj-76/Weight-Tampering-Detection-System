
# Detection and Prevention of Tampering in Weighing Instruments

## Project Overview

The **Detection and Prevention of Tampering in Weighing Instruments** project is designed to improve the security, reliability, and transparency of electronic weighing systems.

Traditional weighing instruments may be affected by physical interference, abnormal movement, magnetic disturbances, enclosure opening, or electrical variations. These activities can affect the reliability of weight measurements.

This project uses multiple sensors, a **Raspberry Pi Pico 2 W**, sensor-data processing, and a tampering detection mechanism to monitor the weighing instrument and identify suspicious conditions.

The system processes sensor readings, applies a filtering stage, evaluates the readings against defined thresholds, and generates alerts when potential tampering is detected. It also supports event logging and Wi-Fi-based remote monitoring.

## Objectives

- Detect possible tampering in weighing instruments.
- Monitor weight measurements and sensor conditions.
- Identify abnormal vibration, tilt, and movement.
- Detect possible enclosure opening and magnetic disturbances.
- Monitor electrical parameters and supply variations.
- Reduce false tampering alerts using sensor-data filtering.
- Generate alerts when suspicious conditions are detected.
- Maintain records of weight readings and tampering events.
- Provide remote monitoring through a dashboard.
- Provide separate login pages for Public Users and Government Authorities.

## Hardware Components

| Component | Purpose |
|---|---|
| Raspberry Pi Pico 2 W | Main controller for sensor acquisition and system operation |
| Load Cell | Measures the applied weight |
| HX711 | Amplifies and converts the load-cell signal into digital readings |
| MPU6050 | Detects motion, vibration, and orientation changes |
| HMC5883L | Measures magnetic-field variations |
| LDR or Tamper Loop | Helps detect enclosure opening or physical interference |
| INA219 | Monitors electrical parameters such as voltage and current |
| 16×2 I²C LCD | Displays system information locally |
| Buzzer | Provides an audible alert |
| LEDs | Indicate system or alert status |
| Local Storage | Stores available readings and event records |

## Software and Technologies

- **Embedded C / Microcontroller Firmware:** Controls sensor readings and system operations.
- **Arduino IDE / Thonny:** Used for firmware development and programming, as applicable to the implementation.
- **Python:** Used for data preparation, analysis, testing, and filtering-related development where applicable.
- **CSV Data Files:** Used for storing or processing sensor data during analysis and testing.
- **ML-Based Filtering Stage:** Helps filter sensor readings before the threshold-based tampering decision.
- **Wi-Fi Communication:** Supports remote monitoring and communication when available.
- **Monitoring Dashboard:** Displays available weight readings, trust score, sensor states, and event history.

## System Architecture

The system follows a sensor-based monitoring and tampering-detection approach.

1. The load cell measures the applied weight.
2. The HX711 processes the load-cell signal for digital reading.
3. The MPU6050 monitors movement, vibration, and orientation.
4. The HMC5883L measures magnetic-field variations.
5. The LDR or tamper loop helps identify possible enclosure interference.
6. The INA219 monitors electrical parameters.
7. The Raspberry Pi Pico 2 W collects sensor information.
8. Sensor readings undergo validity checks and a filtering stage.
9. The processed readings are evaluated against defined thresholds and multiple sensor conditions.
10. If a suspicious condition is identified, the system can generate an alert and record the event.
11. Available information can be communicated over Wi-Fi for remote monitoring.

## Working Principle

### 1. Sensor Data Collection

The system collects information from the load cell and other sensors. Each sensor monitors a different aspect of the weighing instrument.

### 2. Data Validation

The collected readings are checked for validity before being used for tampering detection.

### 3. ML-Based Filtering

A filtering stage is used to process sensor data before the threshold-based decision. Its purpose is to help reduce the effect of unwanted variations and avoid unnecessary alerts.

### 4. Threshold-Based Detection

The processed sensor values are compared with predefined thresholds. Unusual values or combinations of sensor conditions can indicate possible tampering.

### 5. Multi-Sensor Decision

The system considers information from multiple sensors to assess suspicious conditions rather than relying only on a single measurement.

### 6. Alert Generation

When a possible tampering condition is detected, the system can provide an alert through the available buzzer, LEDs, or monitoring interface.

### 7. Event Logging

Weight readings and detected events can be recorded for later inspection and monitoring.

### 8. Remote Monitoring

Wi-Fi communication allows available system information to be sent to a monitoring dashboard.

## Tampering Conditions Monitored

### 1. Abnormal Weight Readings

The load cell and HX711 monitor weight measurements. Unusual changes can be examined along with other sensor readings to identify suspicious activity.

### 2. Vibration and Movement

The MPU6050 monitors vibration, movement, and orientation changes that may indicate physical interference.

### 3. Tilt or Relocation

Changes in orientation or movement can help identify whether the weighing instrument has been tilted or relocated.

### 4. Magnetic Disturbance

The HMC5883L measures magnetic-field variations that may indicate a possible magnetic disturbance.

### 5. Enclosure Opening

The LDR or tamper loop helps detect possible opening or interference with the instrument enclosure.

### 6. Electrical Disturbance

The INA219 monitors electrical parameters to help identify unusual supply or electrical conditions.

**Note:** Individual sensor readings are indicators of possible interference. Their interpretation depends on the configured detection rules and operating conditions.

## Remote Monitoring Dashboard

The monitoring dashboard provides a visual interface for observing the weighing instrument's status and reviewing available data.

### 1. Current System Status

The dashboard displays the current operating or security status of the system. It helps users understand whether the system is online and whether monitored conditions are reported as normal or suspicious.

### 2. Live Weight Monitoring

The dashboard displays the current weight reading received from the weighing system.

This feature helps users:

- Observe the measured weight.
- Monitor changes in weight readings.
- Review available weight history.
- Identify readings that may require further inspection.

### 3. Trust Score

The dashboard includes a trust score to represent the system's reported level of confidence or security.

It provides a quick visual indication of the current system condition. The exact calculation of the trust score depends on the implemented logic.

### 4. Individual Sensor Status

The dashboard can display the status of individual monitored sensors.

| Sensor | Information Monitored |
|---|---|
| Load Cell + HX711 | Weight measurements |
| MPU6050 | Motion, vibration, and orientation |
| HMC5883L | Magnetic-field variations |
| LDR or Tamper Loop | Possible enclosure interference |
| INA219 | Electrical parameters |

This information helps users identify which monitored condition may require attention.

### 5. Weight History

The weight history allows users to review previously recorded weight readings, where available.

It can help with:
- Comparing earlier and current readings.
- Observing changes over time.
- Reviewing measurements during an inspection.
- Identifying unusual changes that may require investigation.

### 6. Tampering History

The tampering history provides access to recorded tampering events, where available.

It helps users review:
- Previously detected suspicious conditions.
- The type of event recorded.
- Changes in the system's security status.
- Records useful for further inspection.

The exact event details depend on the information stored by the implementation.

### 7. Remote System Monitoring

The Raspberry Pi Pico 2 W supports Wi-Fi communication. The dashboard can display the system information made available through the implemented communication mechanism.

Remote monitoring helps users check system status without needing to observe the physical weighing instrument continuously.

## Separate Login Pages

The website provides two distinct login entry points:

1. **Public User Login**
2. **Government Authority Login**

Each login page is intended for a different category of user.

### 1. Public User Login

The Public User login page is intended for ordinary users who need to access the available weighing-system monitoring information.

After successful login, the Public User can access the dashboard features permitted for that account.

The intended dashboard features include:

- View current weight readings.
- Check the available system status.
- View the trust score.
- Monitor available sensor-status information.
- Review available weight history.
- View relevant tampering alerts and records, if access is provided.

The Public User interface is intended to make the system's available monitoring information easy to understand.

### 2. Government Authority Login

The Government Authority login page is intended for authorized officials who need to monitor the weighing instrument and review possible tampering incidents.

After successful login, the authority can access the dashboard features permitted for that account.

The intended dashboard features include:

- Monitor the current system status.
- View weight readings and available history.
- Review individual sensor statuses.
- Check recorded tampering events.
- Examine suspicious conditions for inspection.
- Review available monitoring records to support verification.

This interface is intended to support the monitoring and inspection of weighing instruments.

### 3. Login and Dashboard Workflow

1. The user opens the project website.
2. The user selects either Public User Login or Government Authority Login.
3. The user enters the required login credentials.
4. The system verifies the credentials.
5. After successful authentication, the user is directed to the appropriate dashboard.
6. The dashboard displays the information available to that user.

Separate login pages provide distinct entry points for the two user categories. Different dashboard permissions must also be enforced by the authentication system if the two roles are intended to have different access rights.

## System Workflow

1. The load cell measures the applied weight.
2. The HX711 converts the load-cell signal into digital readings.
3. The other sensors monitor movement, magnetic variation, enclosure interference, and electrical conditions.
4. The Raspberry Pi Pico 2 W collects the sensor data.
5. The system checks the validity of the readings.
6. The filtering stage processes the sensor data.
7. The processed readings are evaluated using the defined thresholds and sensor conditions.
8. If possible tampering is detected, the system generates an appropriate alert.
9. Available readings and events are recorded.
10. Relevant information is made available through the monitoring dashboard.
11. Users access the website through the appropriate login page.

## Testing and Evaluation

The project considers the following test conditions:

- Normal weighing operation.
- Enclosure opening.
- Abnormal vibration.
- Tilt or relocation.
- Magnetic disturbance.
- Electrical supply disturbance.
- Event logging.
- Communication and remote monitoring.

These tests help evaluate the system's ability to monitor the weighing instrument and respond to different operating and interference conditions.

The project report lists the following performance figures:

| Parameter | Reported Value |
|---|---:|
| Accuracy | 98% |
| Precision | 100 |
| Recall | 90 |
| False-positive rate | 0.8 |
| Detection latency | 200 ms |
| Log reliability | 99% |

These values are reproduced from the project report. The precision and false-positive figures do not specify their units or scales in the report, so they should be interpreted according to the original evaluation method.

## Expected Benefits

- Helps detect possible tampering in weighing instruments.
- Monitors multiple physical and electrical conditions.
- Combines information from different sensors.
- Uses a filtering stage before threshold-based detection.
- Provides local alerts when supported by the implementation.
- Supports recording of weight readings and tampering events.
- Provides remote monitoring through Wi-Fi.
- Displays system status and sensor information on a dashboard.
- Provides separate login entry points for Public Users and Government Authorities.
- Supports review of available monitoring records.

## Conclusion

The Detection and Prevention of Tampering in Weighing Instruments project combines weight measurement, multi-sensor monitoring, data filtering, threshold-based detection, alerts, event logging, and remote monitoring.

The Raspberry Pi Pico 2 W acts as the central controller, collecting information from the connected sensors and coordinating the detection process. The monitoring dashboard helps users observe weight readings, trust score, sensor status, and available event history.

Separate Public User and Government Authority login pages provide distinct access points for the website. When implemented with appropriate authentication and access permissions, these pages can support different monitoring needs.

Overall, the project aims to improve the monitoring, security, and reliability of weighing instruments by identifying suspicious conditions and making relevant system information available for inspection.
