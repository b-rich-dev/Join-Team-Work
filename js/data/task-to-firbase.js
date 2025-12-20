import { firebaseData } from "../../main.js";

export let allData = {};

/** * Main function to convert and send task object to Firebase.
 * @param {object} receivedObject - The raw input object representing the task.
 * @param {object} fetchData - The current fetched data from Firebase.
 */
export async function CWDATA(receivedObject, fetchData) {
  allData = fetchData;
  const convertedObjectWithId = await processRawObject(receivedObject);
}

/** * Processes the raw input object to prepare it for Firebase.
 * @param {object} input - The raw input object.
 * @returns {object} - The processed object ready for Firebase.
 */
async function processRawObject(input) {
  let { pushObjectId, rawNewObject } = checkDataStructure(input);
  rawNewObject = arraysToObjects(rawNewObject);
  if (pushObjectId == null) pushObjectId = setNextId("task");
  const result = await sendObject(pushObjectId, rawNewObject);
  return result;
}

/** * Checks the structure of the input object to determine if it contains a single key object.
 * @param {object} input - The input object to check.
 * @returns {object} - An object containing pushObjectId and rawNewObject.
 */
function checkDataStructure(input) {
  if (typeof input == "object" && !Array.isArray(input)) {
    const keys = Object.keys(input);
    if (keys.length == 1 && typeof input[keys[0]] == "object") {
      return {
        pushObjectId: keys[0],
        rawNewObject: input[keys[0]],
      };
    }
  }
  return {
    pushObjectId: null,
    rawNewObject: input,
  };
}

/** * Converts assigned user names to their corresponding contact keys.
 * @param {object} rawNewObject - The raw object containing task details.
 * @returns {string[]} - Array of contact keys corresponding to assigned users.
 */
function convertContacts(rawNewObject) {
  const contactKeys = rawNewObject.assignedUsers.map((user) => {
    const keys = Object.keys(allData.contacts);
    const foundKey = keys.find(
      (key) => allData.contacts[key].name === user.name
    );
    return foundKey;
  });
  return contactKeys;
}

/** * Converts arrays in the object to objects with index keys, except for specific fields.
 * @param {object} obj - The raw object.
 * @returns {object} - The object with arrays converted to objects.
 */
function arraysToObjects(obj) {
  for (const key in obj) {
    if (
      Array.isArray(obj[key]) &&
      key !== "assignedUsers" &&
      key !== "checkedSubtasks" &&
      key !== "totalSubtasks" &&
      key !== "attachments"
    ) {
      obj[key] = obj[key].map((item, index) => [index, item]);
    }
  }
  return obj;
}

/** * Composes the next available ID for a new task.
 * @param {string} category - "users", "tasks" or "contacts".
 * @returns new key (string).
 */
function setNextId(category) {
  let lastKey = getLastKey(category);
  const [prefix, numberStr] = lastKey.split("-");
  const nextNumber = (Number(numberStr) + 1).toString().padStart(3, "0");
  return `${prefix}-${nextNumber}`;
}

/** * Helper function for "setNextId"; extract number of last key (e.g. "task-006"), compose next key.
 * @param {string} category - "users", "tasks" or "contacts".
 * @returns new key (string).
 */
function getLastKey(category) {
  if (!allData || Object.keys(allData.tasks).length == 0) {
    return `${category}-000`;
  } else {
    const itemKeys = Object.keys(allData.tasks);
    return itemKeys.at(-1);
  }
}

/** * Sends the prepared object to Firebase and updates local cache.
 * @param {string} pushObjectId - The ID for the new task (e.g., "task-009").
 * @param {object} rawNewObject - The raw object containing task details.
 * @returns {object} - The object that was sent to Firebase.
 */
async function sendObject(pushObjectId, rawNewObject) {
  let path = `tasks/${pushObjectId}`;
  await saveToFirebase(path, rawNewObject);

  const localObject = { [pushObjectId]: rawNewObject, };
  allData = allData || {};
  allData.tasks = allData.tasks || {};
  if (rawNewObject === null) delete allData.tasks[pushObjectId];
  else Object.assign(allData.tasks, localObject);

  if (typeof window !== 'undefined' && window.firebaseData) {
    window.firebaseData.tasks = window.firebaseData.tasks || {};
    if (rawNewObject === null) delete window.firebaseData.tasks[pushObjectId];
    else Object.assign(window.firebaseData.tasks, localObject);
  }

  return rawNewObject;
}

/** * Saves data to Firebase at the specified path.
 * @param {string} path - The Firebase path where data should be saved.
 * @param {object|null} data - The data to save, or null to delete.
 * @returns {Promise<boolean>} - True if the operation was successful.
 */
async function saveToFirebase(path, data) {
  const url = buildFirebaseUrl(path);
  try {
    const response = await sendToFirebase(url, data);
    await validateResponse(response);
    return true;
  } catch (error) {
    handleFirebaseError(error, path, data);
    throw error;
  }
}

/** * Builds the full Firebase URL for a given path.
 * @param {string} path - The Firebase path.
 * @returns {string} - The full Firebase URL.
 */
function buildFirebaseUrl(path) {
  return `https://join-46697-default-rtdb.europe-west1.firebasedatabase.app/${path}.json`;
}

/** * Sends data to Firebase, handling null data appropriately.
 * @param {string} url - The Firebase URL.
 * @param {object|null} data - The data to send, or null.
 * @returns {Promise<Response>} - The fetch response.
 */
async function sendToFirebase(url, data) {
  return data === null ? await sendNullData(url) : await sendRegularData(url, data);
}

/** * Sends null data to Firebase using PUT or PATCH.
 * @param {string} url - The Firebase URL.
 * @returns {Promise<Response>} - The fetch response.
 */
async function sendNullData(url) {
  let response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: "null",
  });
  if (!response.ok) {
    response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "null",
    });
  }
  return response;
}

/** * Sends regular data to Firebase using PUT.
 * @param {string} url - The Firebase URL.
 * @param {object} data - The data to send.
 * @returns {Promise<Response>} - The fetch response.
 */
async function sendRegularData(url, data) {
  return await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/** * Validates the fetch response from Firebase.
 * @param {Response} response - The fetch response.
 * @throws Will throw an error if the response is not ok.
 */
async function validateResponse(response) {
  if (!response.ok) {
    const resText = await response.text().catch(() => "");
    throw new Error(`Firebase update failed: ${response.status} ${response.statusText}${resText ? ` | ${resText}` : ""}`);
  }
}

/** * Handles errors that occur during Firebase operations.
 * @param {Error} error - The error object.
 * @param {string} path - The Firebase path involved in the operation.
 * @param {object|null} data - The data that was being sent.
 */
function handleFirebaseError(error, path, data) {
  console.error("Firebase fetch failed:", {
    path,
    method: data === null ? "PUT/PATCH null" : "PUT",
    message: error?.message,
  });
}