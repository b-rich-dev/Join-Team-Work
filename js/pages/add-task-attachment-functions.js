// Globale Variable für alle Bilder
let allImages = [];

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
    let myGallery;

    gallery.innerHTML = "";

    // Entferne altes Tooltip falls vorhanden
    const oldTooltip = labelContainer?.querySelector('.attachment-tooltip');
    if (oldTooltip) {
        oldTooltip.remove();
    }

    // Zerstöre existierende Viewer-Instanz falls vorhanden
    if (myGallery) {
        myGallery.destroy();
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
        const deleteIcon = document.createElement('img');
        deleteIcon.src = "../assets/icons/btn/delete-white.svg";
        deleteIcon.alt = "Delete Icon";
        deletebtn.appendChild(deleteIcon);
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
            tooltip.style.top = 'auto';
            tooltip.style.left = 'auto';
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
                zoomIn: true,
                zoomOut: true,
                oneToOne: true,
                reset: true,
                prev: true,
                play: {
                    show: true,
                    size: 'large',
                },
                next: true,
                rotateLeft: true,
                rotateRight: true,
                flipHorizontal: true,
                flipVertical: true,
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