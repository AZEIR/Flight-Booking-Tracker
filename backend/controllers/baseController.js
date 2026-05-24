class BaseController {
  // Send a standardized success JSON response
  sendSuccess(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({ success: true, data, message });
  }

  // Send a standardized error JSON response, dynamically mapping message to technical details if omitted
  sendError(res, error, message = null, statusCode = 500) {
    const technicalMessage = error?.message || error;
    return res.status(statusCode).json({
      success: false,
      message: message || technicalMessage || "An error occurred",
      error: technicalMessage,
    });
  }
}

module.exports = BaseController;
