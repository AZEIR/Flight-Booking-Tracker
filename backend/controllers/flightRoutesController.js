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

  getFlightById = async (req, res) => {
    try {
      const flight = await AviationData.findById(req.params.id);
      if (!flight) {
        return this.sendError(res, "Flight not found", null, 404);
      }
      this.sendSuccess(res, flight, "Flight retrieved successfully");
    } catch (error) {
      this.sendError(res, error, "Failed to retrieve flight details");
    }
  };
}

module.exports = new FlightRoutesController();
