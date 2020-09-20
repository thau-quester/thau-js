const generateFacebookInitScript = (clientId: string, graphVersion: string) => `
window.fbAsyncInit = function() {
  FB.init({
    appId      : '${clientId}',
    cookie     : true,                       // Enable cookies to allow the server to access the session.
    version    : '${graphVersion}'           // Use this Graph API version for this call.
  });
};
(function(d, s, id) {                        // Load the SDK asynchronously
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
`

export const initFBApi = (clientId: string, graphVersion: string) => {
  const script = document.createElement('script')
  script.id = 'facebookapi-loader'
  script.innerHTML = generateFacebookInitScript(clientId, graphVersion)
  document.body.appendChild(script)
}

export const initGoogleApi = (clientId: string) =>
  new Promise((resolve, reject) => {
    const googleScriptsDependencies = document.createElement('div')
    googleScriptsDependencies.id = 'gapi-loader'

    const googleClientscript = document.createElement('script')
    googleClientscript.src =
      'https://apis.google.com/js/client:platform.js?onload=start'
    googleClientscript.async = true
    googleClientscript.id = 'gapi-script'
    googleScriptsDependencies.appendChild(googleClientscript)

    document.body.appendChild(googleScriptsDependencies)

    googleClientscript.addEventListener('load', () => resolve())
  })
