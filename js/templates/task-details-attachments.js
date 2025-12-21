/** * Normalizes attachment data by calculating missing size and type fields.
 * @param {object} attachment - The attachment object.
 * @returns {object} The normalized attachment object.
 */
export function normalizeAttachment(attachment) {
  const normalized = { ...attachment };
  normalizeAttachmentSize(normalized);
  normalizeAttachmentType(normalized);
  return normalized;
}

/** * Normalizes the size of an attachment.
 * @param {object} normalized - The attachment object.
 */
function normalizeAttachmentSize(normalized) {
  if (typeof normalized.size !== 'number' || normalized.size === 0) {
    normalized.size = calculateBase64Size(normalized.base64);
  }
}

/** * Calculates the size in bytes of a base64 encoded string.
 * @param {string} base64 - The base64 encoded string.
 * @returns {number} The size in bytes.
 */
function calculateBase64Size(base64) {
  if (!base64) return 0;
  const comma = base64.indexOf(',');
  const b64 = comma >= 0 ? base64.slice(comma + 1) : base64;
  const len = b64.length;
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((len * 3) / 4) - padding);
}

/** * Normalizes the type of an attachment.
 * @param {object} normalized - The attachment object.
 */
function normalizeAttachmentType(normalized) {
  if (normalized.type) return;

  if (normalized.base64?.startsWith('data:image/png')) {
    normalized.type = 'image/png';
  } else if (normalized.base64?.startsWith('data:image/jpeg') || normalized.base64?.startsWith('data:image/jpg')) {
    normalized.type = 'image/jpeg';
  } else if (normalized.base64?.startsWith('data:image/')) {
    const match = normalized.base64.match(/^data:([^;]+);/);
    normalized.type = match ? match[1] : 'image/jpeg';
  } else {
    normalized.type = 'image/jpeg';
  }
}

/** * Creates the HTML section for task attachments.
 * @param {object} task - The task object.
 * @returns {string} The HTML string for the attachments section.
 */
export function getTaskAttachmentsSection(task) {
  if (!task?.attachments || task.attachments.length === 0) return "";

  const attachmentsHtml = task.attachments.map((attachment, index) => {
    const normalized = normalizeAttachment(attachment);
    const isImage = normalized.type && normalized.type.startsWith('image/');

    return `<div class="attachment-item" data-tooltip="${normalized.name}" data-index="${index}">
            ${isImage ? `<img src="${normalized.base64}" alt="${normalized.name}" data-attachment-index="${index}" data-name="${normalized.name}" data-type="${normalized.type}" data-size="${normalized.size}" />` :
        `<div class="attachment-file-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14,2 14,8 20,8" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>`}
              <p class="attachment-description">${normalized.name}</p>
              <div class="delete-attachment-btn" onclick="downloadAttachment('${normalized.base64}', '${normalized.name}', '${normalized.type}')">
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: relative; left: 2px;">
                  <mask id="mask0_266054_1268" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask><g mask="url(#mask0_266054_1268)"><mask id="mask1_266054_1268" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="-1" y="0" width="25" height="24"><rect x="-0.144531" width="24" height="24" fill="#D9D9D9"/></mask><g mask="url(#mask1_266054_1268)"><path d="M10.8555 12.1501V6.1001C9.5888 6.33343 8.60547 6.94593 7.90547 7.9376C7.20547 8.92926 6.85547 9.9501 6.85547 11.0001H6.35547C5.3888 11.0001 4.5638 11.3418 3.88047 12.0251C3.19714 12.7084 2.85547 13.5334 2.85547 14.5001C2.85547 15.4668 3.19714 16.2918 3.88047 16.9751C4.5638 17.6584 5.3888 18.0001 6.35547 18.0001H18.3555C19.0555 18.0001 19.6471 17.7584 20.1305 17.2751C20.6138 16.7918 20.8555 16.2001 20.8555 15.5001C20.8555 14.8001 20.6138 14.2084 20.1305 13.7251C19.6471 13.2418 19.0555 13.0001 18.3555 13.0001H16.8555V11.0001C16.8555 10.2001 16.6721 9.45426 16.3055 8.7626C15.9388 8.07093 15.4555 7.48343 14.8555 7.0001V4.6751C16.0888 5.25843 17.0638 6.12093 17.7805 7.2626C18.4971 8.40426 18.8555 9.6501 18.8555 11.0001C20.0055 11.1334 20.9596 11.6293 21.718 12.4876C22.4763 13.3459 22.8555 14.3501 22.8555 15.5001C22.8555 16.7501 22.418 17.8126 21.543 18.6876C20.668 19.5626 19.6055 20.0001 18.3555 20.0001H6.35547C4.8388 20.0001 3.54297 19.4751 2.46797 18.4251C1.39297 17.3751 0.855469 16.0918 0.855469 14.5751C0.855469 13.2751 1.24714 12.1168 2.03047 11.1001C2.8138 10.0834 3.8388 9.43343 5.10547 9.1501C5.3888 7.9501 6.09714 6.80843 7.23047 5.7251C8.3638 4.64176 9.57214 4.1001 10.8555 4.1001C11.4055 4.1001 11.8763 4.29593 12.268 4.6876C12.6596 5.07926 12.8555 5.5501 12.8555 6.1001V12.1501L13.7555 11.2751C13.9388 11.0918 14.168 11.0001 14.443 11.0001C14.718 11.0001 14.9555 11.1001 15.1555 11.3001C15.3388 11.4834 15.4305 11.7168 15.4305 12.0001C15.4305 12.2834 15.3388 12.5168 15.1555 12.7001L12.5555 15.3001C12.3555 15.5001 12.1221 15.6001 11.8555 15.6001C11.5888 15.6001 11.3555 15.5001 11.1555 15.3001L8.55547 12.7001C8.37214 12.5168 8.2763 12.2876 8.26797 12.0126C8.25964 11.7376 8.35547 11.5001 8.55547 11.3001C8.7388 11.1168 8.96797 11.0209 9.24297 11.0126C9.51797 11.0043 9.75547 11.0918 9.95547 11.2751L10.8555 12.1501Z" fill="white"/></g></g>
                </svg>
              </div>
            </div>`;
  }).join("");

  return `<div class="taskCardField attachments-section">
            <p class="attachments-title">Attachments:</p>
            <div id="task-attachment-list" class="attachment-list">${attachmentsHtml}</div>
          </div>`;
}

/** Converts base64 data to a Blob object.
 * @param {string} base64Data - The base64 encoded file data.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Blob} The resulting Blob object.
 */
function createBlobFromBase64(base64Data, mimeType) {
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType || 'application/octet-stream' });
}

/** Triggers the download of a Blob object as a file.
 * @param {Blob} blob - The Blob object to download.
 * @param {string} filename - The filename for the download.
 */
function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'attachment';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/** Fallback download method using direct base64 data.
 * @param {string} base64Data - The base64 encoded file data.
 * @param {string} filename - The filename for the download.
 */
function triggerDirectDownload(base64Data, filename) {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = filename || 'attachment';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** * Downloads an attachment file from base64 data, converting it back to original format.
 * @param {string} base64Data - The base64 encoded file data.
 * @param {string} filename - The filename for the download.
 * @param {string} mimeType - The original MIME type of the file.
 */
window.downloadAttachment = function (base64Data, filename, mimeType) {
  try {
    const blob = createBlobFromBase64(base64Data, mimeType);
    triggerDownload(blob, filename);
  } catch (error) {
    console.error('Download failed:', error);
    triggerDirectDownload(base64Data, filename);
  }
};