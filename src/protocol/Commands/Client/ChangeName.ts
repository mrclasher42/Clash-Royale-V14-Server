// @ts-nocheck
function isValidString(str) {
  if (typeof str !== "string") return false;

  // Allow:
  // Letters (A-Z, a-z)
  // Numbers (0-9)
  // Space
  // / , . - _ ( ) < >
  const regex = /^[A-Za-z0-9\/,\.\-_()<> ]+$/;

  return regex.test(str);
}

class ChangeName {
  constructor(client) {
    this.client = client;
    this.commandID = 747;
  }

  decode(buf) {}
  process() {
    //not userful due to SetPlayerNameMessage already set
  }
}

module.exports = ChangeName;

