# Privacy Policy

**Effective Date**: 2024-01-01  
**Last Updated**: 2024-01-01

---

## Overview

PRISM Lens (hereinafter "this extension", "we", or "our") is committed to protecting your privacy. This privacy policy explains what data we collect, how we use it, and your rights.

**Key Point**: This extension does NOT collect, store, or transmit any personal data.

---

## Data Collection

### What We DO NOT Collect

- ❌ Personal information (name, email, phone number, etc.)
- ❌ Browsing history
- ❌ Search queries
- ❌ Login credentials
- ❌ Financial information
- ❌ Location data
- ❌ Device information
- ❌ IP addresses
- ❌ Cookies or tracking data

### What We DO Store (Local Only)

The following data is stored **locally on your device** using `chrome.storage.sync`:

1. **Theme Preference** - Your selected theme (default/dark/ocean/sakura)
2. **Settings**:
   - Slow loading threshold (ms)
   - Default tab selection
   - Default export format
   - Display preferences (show size, show duration)

**Important**: This data is:
- ✅ Stored locally in your browser
- ✅ Never sent to any external server
- ✅ Synced only via your browser's built-in sync (if enabled)
- ✅ Deleted when you uninstall the extension

---

## Permissions Usage

This extension requests the following permissions:

### `activeTab`
**Purpose**: Read the current page's DOM structure and Performance API data to extract resources.  
**When Used**: Only when you click the extension icon.  
**Data Collected**: None sent externally; all processing is local.

### `scripting`
**Purpose**: Inject content script into the page to extract resources.  
**Scope**: Read-only; does not modify page content or inject ads.

### `storage`
**Purpose**: Save your theme and filter preferences locally.  
**Data**: Theme selection and settings (as described above).

### `contextMenus`
**Purpose**: Register right-click menu shortcuts for quick extraction.  
**When Used**: Only when you right-click.

### `downloads`
**Purpose**: Download resources when you click the download button.  
**User Control**: Downloads only occur when you actively trigger them.

### `<all_urls>` (Host Permissions)
**Purpose**: Proxy download of cross-origin resources through Service Worker to bypass CORS restrictions.  
**When Used**: ONLY when you actively trigger "Export as ZIP".  
**Important**: No data is uploaded to any external server; all processing is local.

---

## Third-Party Services

This extension does NOT use any third-party services, including:

- ❌ No analytics (Google Analytics, etc.)
- ❌ No crash reporting
- ❌ No advertising networks
- ❌ No external APIs
- ❌ No telemetry

---

## Data Retention

Since we do not collect any data, there is nothing to retain.

Local settings stored in your browser are:
- Kept indefinitely until you uninstall the extension
- Deleted automatically when you uninstall

---

## Children's Privacy

This extension does not knowingly collect information from anyone, including children under 13.

---

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted at:

https://github.com/supercj/web-resource-extractor/blob/main/PRIVACY_EN.md

---

## Contact

If you have questions about this privacy policy, please:

- Open an issue on GitHub: https://github.com/supercj/web-resource-extractor/issues
- Email: [Your Contact Email]

---

## Your Rights

You have the right to:

- ✅ View what data is stored (open DevTools → Application → Storage)
- ✅ Delete your data (uninstall the extension)
- ✅ Disable the extension at any time

---

## Compliance

This extension complies with:

- Microsoft Edge Add-ons Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)

---

**Summary**: This extension operates entirely locally on your device. No personal data is collected, stored, or transmitted to any external server. All resource extraction and processing happens in your browser.

---

**Last Updated**: 2024-01-01  
**Version**: 1.1.0
