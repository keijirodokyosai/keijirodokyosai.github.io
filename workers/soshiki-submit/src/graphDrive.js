/**
 * OneDrive (drive) helpers for Graph app-only access.
 */

export function driveContentUrl(userId, pathSegments) {
  const encodedPath = pathSegments
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://graph.microsoft.com/v1.0/users/${userId}/drive/root:/${encodedPath}:/content`;
}

export async function downloadDriveFile(userId, token, pathSegments) {
  const url = driveContentUrl(userId, pathSegments);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Download ${pathSegments.join("/")}: ${response.status} ${text}`
    );
  }
  return await response.text();
}

export async function uploadDriveFile(userId, token, pathSegments, body, contentType) {
  const url = driveContentUrl(userId, pathSegments);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload ${pathSegments.join("/")}: ${response.status} ${text}`);
  }
}
