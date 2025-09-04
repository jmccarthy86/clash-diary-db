function getParentOrigin() {
    try {
        var ref = document.referrer ? new URL(document.referrer).origin : "";
        if (ref === "https://solt.co.uk" || ref === "https://soltdigital.co.uk") return ref;
    } catch (e) {}
    return "https://solt.co.uk";
}

function sendHeight() {
    if (!document.body.hasAttribute("data-scroll-locked")) {
        var height = document.body.scrollHeight;
        window.parent.postMessage({ height: height }, getParentOrigin());
    }
}

function sendLockedHeight() {
    window.parent.postMessage({ height: 750 }, getParentOrigin());
}

window.onload = sendHeight;

var resizeObserver = new ResizeObserver(sendHeight);
resizeObserver.observe(document.body);

var mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-scroll-locked") {
            const isScrollLocked = document.body.hasAttribute("data-scroll-locked");
            if (isScrollLocked) {
                console.log("Scroll locked: true");
                sendLockedHeight();
            } else {
                console.log("Scroll locked: false");
                sendHeight(); // Send actual height if scroll is unlocked
            }
        }
    });
});

mutationObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-scroll-locked"],
});
