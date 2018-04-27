import * as tweetnacl from 'tweetnacl';

// The identifier of your application.
let applicationID = 'myprivatenote@datapeps.com';

// This secretToken MUST be never published.
// In the real world the application server MUST retains this secretToken.
// The client application should never access to this token.
const secretToken = 'BUSuhYu5TGTyxyxNqwqRuRc1AkVW0hMoOwTIm55fip1RawGYe6x77ChzbU/o3r8rTMea3mWmp2uFTbfE0yo9Gw==';

// Convert yout base64 secretToken to Uint8Array
let uSecretToken = Uint8Array.from(atob(secretToken), c => c.charCodeAt(0))

// This function is an example of how a server applications should sign a
// DataPeps delegated access request.
export function sign({ login, publicKey }) {
    // Convert login to Uint8Array.
    let ulogin = new TextEncoder().encode(login);
    // Create the message to sign, concat login and publicKey.
    let msg = new Uint8Array(ulogin.byteLength + publicKey.byteLength);
    msg.set(ulogin, 0);
    msg.set(publicKey, ulogin.byteLength);
    // Use tweetnacl to sign the data.
    let sign = tweetnacl.sign.detached(msg, uSecretToken);
    return Promise.resolve({ requester: applicationID, sign })
}