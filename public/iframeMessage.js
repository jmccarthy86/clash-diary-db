function sendHeight() {
    if (!document.body.hasAttribute("data-scroll-locked")) {
        var height = document.body.scrollHeight;
        window.parent.postMessage(
            { height: height },
            "https://soltdigital.co.uk"
        );
    }
}

function sendLockedHeight() {
    window.parent.postMessage({ height: 750 }, "https://soltdigital.co.uk");
}

window.onload = sendHeight;

var resizeObserver = new ResizeObserver(sendHeight);
resizeObserver.observe(document.body);

var mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (
            mutation.type === "attributes" &&
            mutation.attributeName === "data-scroll-locked"
        ) {
            const isScrollLocked =
                document.body.hasAttribute("data-scroll-locked");
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
