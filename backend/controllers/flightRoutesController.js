const AviationData = require("../models/AviationDatas");

const getAvailableFlights = async (req, res) => {
  try {
    const liveSchedules = await AviationData.find({});

    res.status(200).json(liveSchedules);
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

module.exports = { getAvailableFlights };
