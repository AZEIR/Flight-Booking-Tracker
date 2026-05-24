const AviationData = require("../models/AviationDatas");
const BaseController = require("./baseController");

class FlightRoutesController extends BaseController {
  // Retrieve all available flight schedules from the database
  getAvailableFlights = async (req, res) => {
    try {
      const liveSchedules = await AviationData.find({});
      this.sendSuccess(
        res,
        liveSchedules,
        "Available flights retrieved successfully",
      );
    } catch (error) {
      this.sendError(res, error, "Failed to retrieve flights");
    }
  };
}

module.exports = new FlightRoutesController();
