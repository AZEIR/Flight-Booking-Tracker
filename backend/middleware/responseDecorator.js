const responseDecorator = (req, res, next) => {
  // Store the original res.json function to call later
  const originalJson = res.json;

  // Override the standard res.json function with new behaviour
  res.json = function (body) {
    // If the response already has a 'success' property (matching the standard format), just pass it through
    if (body && Object.prototype.hasOwnProperty.call(body, "success")) {
      return originalJson.call(this, body);
    }

    const statusCode = res.statusCode;
    const isSuccess = statusCode >= 200 && statusCode < 300;

    // Build the decorated, staandard response format
    const decoratedResponse = {};
    decoratedResponse.success = isSuccess;
    decoratedResponse.timestamp = new Date().toISOString();

    // look at which data properties are present in the original response body and use
    if (isSuccess === true) {
      if (body && body.data) {
        decoratedResponse.data = body.data;
      } else if (Array.isArray(body)) {
        // Leave arrays exactly as they are!
        decoratedResponse.data = body;
      } else {
        decoratedResponse.data =
          body && typeof body === "object" ? { ...body } : body || null;
      }
    } else {
      decoratedResponse.data = null; // For error responses (isSuccess is false), set data to null
    }

    // message field
    if (body && body.message) {
      decoratedResponse.message = body.message;
    } else {
      // if custom message not provided, use default message based on success or error
      if (isSuccess) {
        decoratedResponse.message = "Request processed successfully.";
      } else {
        decoratedResponse.message = "Request failed.";
      }
    }

    // if controller only sent one message, not duplicating into data
    if (body && body.message && isSuccess) {
      const keyCount = Object.keys(body).length;
      if (keyCount === 1) {
        decoratedResponse.data = null; // set data to null if only message is present
      }
    }

    // Call the original res.json with the decorated response
    return originalJson.call(this, decoratedResponse);
  };

  next();
};

module.exports = responseDecorator;
