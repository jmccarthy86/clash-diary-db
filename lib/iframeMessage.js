// Function to send the iframe height to parent
function sendHeight() {
	var height = document.body.scrollHeight;
	window.parent.postMessage({ height: height }, 'https://soltukt.test');
}

// Adjust height on load
window.onload = sendHeight;

// Adjust height on content changes
var observer = new MutationObserver(sendHeight);
observer.observe(document.body, {
	attributes: true,
	childList: true,
	subtree: true
});