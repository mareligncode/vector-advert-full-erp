import ProductionMachine from '../models/ProductionMachine.js';

/**
 * Validate environmental sensor reading ranges
 */
export const validateSensorRanges = (req, res, next) => {
  const envParams = req.body.environmentalParameters;
  if (!envParams) {
    return next();
  }

  if (envParams.ambientWorkshopTempCelsius !== undefined) {
    const temp = Number(envParams.ambientWorkshopTempCelsius);
    if (isNaN(temp) || temp < -20 || temp > 65) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ambient workshop temperature: must be between -20°C and 65°C'
      });
    }
  }

  if (envParams.chillerFluidTempCelsius !== undefined) {
    const chiller = Number(envParams.chillerFluidTempCelsius);
    if (isNaN(chiller) || chiller < 0 || chiller > 60) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chiller fluid temperature: must be between 0°C and 60°C'
      });
    }
  }

  if (envParams.pneumaticAirPressureBar !== undefined) {
    const pressure = Number(envParams.pneumaticAirPressureBar);
    if (isNaN(pressure) || pressure < 0 || pressure > 25) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pneumatic air pressure: must be between 0 and 25 Bar'
      });
    }
  }

  if (envParams.nozzleHealthTestPercentage !== undefined) {
    const nozzle = Number(envParams.nozzleHealthTestPercentage);
    if (isNaN(nozzle) || nozzle < 0 || nozzle > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid nozzle health test percentage: must be between 0% and 100%'
      });
    }
  }

  next();
};

/**
 * Verify machine is operational (not in breakdown or maintenance hold)
 */
export const verifyMachineCanOperate = async (req, res, next) => {
  try {
    const machineId = req.body.machineId || req.params.machineId;
    if (!machineId) {
      return next();
    }

    const machine = await ProductionMachine.findById(machineId);
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: `Machine with ID ${machineId} not found`
      });
    }

    if (machine.currentOperationalStatus === 'breakdown') {
      return res.status(422).json({
        success: false,
        message: `Machine ${machine.machineCode} is currently locked in BREAKDOWN. Cannot allocate work.`
      });
    }

    if (machine.currentOperationalStatus === 'maintenance_hold') {
      return res.status(422).json({
        success: false,
        message: `Machine ${machine.machineCode} is under MAINTENANCE HOLD pending pre-shift inspection clearance.`
      });
    }

    req.productionMachine = machine;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify machine operational status',
      error: error.message
    });
  }
};
