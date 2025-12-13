addEventListener("change", async () => {
    const filepicker = document.getElementById("attachment-input");
    const files = filepicker.files;
    if (files.length > 0) {
        Array.from(files).forEach(async file => {
            if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png') ) {
                hideWrongFormatErrorMsg(3600);
                return;
            }

            const blob = new Blob([file], { type: file.type });
            // if (blob.size > 5 * 1024 * 1024) { // 5MB Limit
            // errorDiv.textContent = `Die Datei "${file.name}" überschreitet die maximale Größe von 5MB.`;
            // return;
            // }
            errorDiv.textContent = "";
            console.log("Datei ausgewählt:", blob);

            // const text = await blob.text();
            // console.log("Dateiinhalt als Text:", text);

            const compressedBase64 = await compressImage(file, 800, 800, 0.8);
            allImages.push({
                name: file.name,
                type: blob.type,
                base64: compressedBase64
            });
            save();
            render();
        });
    }
});