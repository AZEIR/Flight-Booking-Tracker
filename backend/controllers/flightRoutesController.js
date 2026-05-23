const AviationData = require("../models/AviationDatas");

const getAvailableFlights = async (req, res) => {
  try {
    // TEMPORARY SANITY CHECK: Strip filters to see if MongoDB returns anything at all
    const liveSchedules = await AviationData.find({});

    console.log("Documents found directly in DB:", liveSchedules);
    res.status(200).json(liveSchedules);
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

module.exports = { getAvailableFlights };
