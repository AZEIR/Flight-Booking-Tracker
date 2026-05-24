const BookingRecord = require("../models/BookingRecords");

class BookingFetcher {
    constructor(req, res) {
        this.req = req;
        this.res = res;
    }

    async fetchData() {
        throw new Error("fetchData() must be implemented by a subclass");
    }

    formatData(bookings) {
        return bookings;
    }

    sendResponse(formattedData) {
        this.res.status(200).json(formattedData);
    }

    async execute() {
        try {
            const rawData = await this.fetchData();
            const formattedData = this.formatData(rawData);
            this.sendResponse(formattedData);
        } catch (error) {
            this.res.status(500).json({
                message: "Failed to retrieve bookings",
                error: error.message,
            });
        }
    }
}

class AdminBookingFetcher extends BookingFetcher {
    async fetchData() {
        return await BookingRecord.find()
            .populate("user" , "name email")
            .populate ("flight")
            .sort({ createdAt: -1 });
    }
}

class UserBookingFetcher extends BookingFetcher {
    async fetchData() {
        return await BookingRecord.find({ user: this.req.user._id })
            .populate("flight")
            .sort({ createdAt: -1 });
    }
}

module.exports = { AdminBookingFetcher, UserBookingFetcher };