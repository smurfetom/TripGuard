// Client-side license scoping for per-license isolation (Option 1)
let currentLicenseId: string = 'default'

export function getCurrentLicenseId(): string {
  return currentLicenseId
}

export function setCurrentLicenseId(id: string): void {
  currentLicenseId = id
}
