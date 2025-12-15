// Globale Variable für alle Bilder
let allImages = [];
let myGallery = null;

addEventListener("change", async () => {
    const filepicker = document.getElementById("attachment-input");
    const files = filepicker.files;

    if (files.length > 0) {
        // Lade existierende Bilder falls vorhanden
        load();

        for (const file of files) {
            if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
                hideWrongFormatErrorMsg(3600);
                continue;
            }

            const blob = new Blob([file], { type: file.type });

            console.log("Datei ausgewählt:", blob);

            const compressedBase64 = await compressImage(file, 800, 800, 0.8);
            allImages.push({
                name: file.name,
                type: blob.type,
                base64: compressedBase64
            });
        }

        save();
        render();
    }
});

function save() {
    let arrayAsString = JSON.stringify(allImages);
    localStorage.setItem("images", arrayAsString);
    console.log("save", arrayAsString);
}

function load() {
    let arrayAsString = localStorage.getItem("images");
    if (arrayAsString && arrayAsString.trim() !== "") {
        try {
            allImages = JSON.parse(arrayAsString);
        } catch (error) {
            console.error("Fehler beim Laden der Bilder aus localStorage:", error);
            allImages = [];
            // Lösche das fehlerhafte localStorage Item
            localStorage.removeItem("images");
        }
    } else {
        allImages = [];
    }
}

function render() {
    const gallery = document.getElementById('attachment-list');
    const deleteAllBtn = document.getElementById('delete-all-attachments');
    const labelContainer = gallery.closest('.label-container');

    gallery.innerHTML = "";

    // Entferne altes Tooltip falls vorhanden
    const oldTooltip = labelContainer?.querySelector('.attachment-tooltip');
    if (oldTooltip) {
        oldTooltip.remove();
    }

    // Zerstöre existierende Viewer-Instanz falls vorhanden
    if (myGallery) {
        myGallery.destroy();
        myGallery = null;
    }

    // Erstelle Tooltip-Element
    const tooltip = document.createElement('div');
    tooltip.classList.add('attachment-tooltip');
    if (labelContainer) {
        labelContainer.appendChild(tooltip);
    }

    // Erstelle alle Bilder
    allImages.forEach((image, index) => {
        const imageElement = document.createElement('div');
        const description = document.createElement('p');
        const deletebtn = document.createElement('div');
        deletebtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask0_266038_5319_${index}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                    <rect width="24" height="24" fill="#D9D9D9"/>
                </mask>
                <g mask="url(#mask0_266038_5319_${index})">
                    <path d="M7 21C6.45 21 5.97917 20.8042 5.5875 20.4125C5.19583 20.0208 5 19.55 5 19V6C4.71667 6 4.47917 5.90417 4.2875 5.7125C4.09583 5.52083 4 5.28333 4 5C4 4.71667 4.09583 4.47917 4.2875 4.2875C4.47917 4.09583 4.71667 4 5 4H9C9 3.71667 9.09583 3.47917 9.2875 3.2875C9.47917 3.09583 9.71667 3 10 3H14C14.2833 3 14.5208 3.09583 14.7125 3.2875C14.9042 3.47917 15 3.71667 15 4H19C19.2833 4 19.5208 4.09583 19.7125 4.2875C19.9042 4.47917 20 4.71667 20 5C20 5.28333 19.9042 5.52083 19.7125 5.7125C19.5208 5.90417 19.2833 6 19 6V19C19 19.55 18.8042 20.0208 18.4125 20.4125C18.0208 20.8042 17.55 21 17 21H7ZM7 6V19H17V6H7ZM9 16C9 16.2833 9.09583 16.5208 9.2875 16.7125C9.47917 16.9042 9.71667 17 10 17C10.2833 17 10.5208 16.9042 10.7125 16.7125C10.9042 16.5208 11 16.2833 11 16V9C11 8.71667 10.9042 8.47917 10.7125 8.2875C10.5208 8.09583 10.2833 8 10 8C9.71667 8 9.47917 8.09583 9.2875 8.2875C9.09583 8.47917 9 8.71667 9 9V16ZM13 16C13 16.2833 13.0958 16.5208 13.2875 16.7125C13.4792 16.9042 13.7167 17 14 17C14.2833 17 14.5208 16.9042 14.7125 16.7125C14.9042 16.5208 15 16.2833 15 16V9C15 8.71667 14.9042 8.47917 14.7125 8.2875C14.5208 8.09583 14.2833 8 14 8C13.7167 8 13.4792 8.09583 13.2875 8.2875C13.0958 8.47917 13 8.71667 13 9V16Z" fill="white"/>
                </g>
            </svg>
        `;
        deletebtn.classList.add('delete-attachment-btn');
        description.textContent = image.name;
        description.classList.add('attachment-description');
        imageElement.classList.add('attachment-item');
        imageElement.setAttribute('data-tooltip', image.name);
        imageElement.setAttribute('data-index', index);
        const img = document.createElement('img');
        img.src = image.base64;
        img.alt = image.name;
        imageElement.appendChild(img);
        imageElement.appendChild(description);
        imageElement.appendChild(deletebtn);

        // Tooltip Event Listeners
        imageElement.addEventListener('mouseenter', (e) => {
            tooltip.textContent = image.name;
            tooltip.style.bottom = '-14px';
            tooltip.style.right = '0px';
            tooltip.style.opacity = '1';
        });

        imageElement.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });

        // Delete Button Event Listener
        deletebtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteAttachment(index);
        });

        gallery.appendChild(imageElement);
    });

    // Initialisiere Viewer nur einmal für die ganze Galerie
    if (allImages.length > 0) {
        deleteAllBtn.style.display = 'flex';
        myGallery = new Viewer(gallery, {
            inline: false,
            button: true,
            navbar: true,
            title: true,
            toolbar: {
                download: {
                    show: 1,
                    size: 'large'
                },
                zoomIn: 1,
                zoomOut: 1,
                oneToOne: 1,
                reset: 1,
                prev: 1,
                play: {
                    show: 1,
                    size: 'large'
                },
                next: 1,
                rotateLeft: 1,
                rotateRight: 1,
                flipHorizontal: 1,
                flipVertical: 1,
                delete: {
                    show: 1,
                    size: 'large'
                }
            },
            delete: (index) => {
                deleteAttachment(index);
                if (myGallery) {
                    myGallery.hide();
                }
            },
            hide() {
                // Remove focus from the active element to prevent aria-hidden warning
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            }
        });
    }
    else {
        deleteAllBtn.style.display = 'none';
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Berechnung der neuen Größe, um die Proportionen beizubehalten
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    } else {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Zeichne das Bild in das Canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Exportiere das Bild als Base64
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };

            img.onerror = () => reject('Fehler beim Laden des Bildes.');
            img.src = event.target.result;
        };

        reader.onerror = () => reject('Fehler beim Lesen der Datei.');
        reader.readAsDataURL(file);
    });
}

function deleteAllAttachments() {
    allImages = [];
    save();
    render();
}

function deleteAttachment(index) {
    allImages.splice(index, 1);
    save();
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    const deleteAllBtn = document.getElementById('delete-all-attachments');
    const attachmentImg = document.querySelectorAll('.attachment-item img');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', deleteAllAttachments);
    }
});