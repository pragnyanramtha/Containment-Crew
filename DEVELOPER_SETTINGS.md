# Developer Settings

This document describes the developer settings system for "Sacrifices Must Be Made".

## Enabling Developer Mode

### Method 1: URL Parameter
Add `?dev=true` to the game URL:
```
http://localhost:3000/index.html?dev=true
```

### Method 2: Local Storage
1. Open the browser console (F12)
2. Run: `localStorage.setItem('devMode', 'true')`
3. Refresh the page

### Method 3: Developer Page
1. Open `developer-mode.html`
2. Click "Enable Developer Mode"
3. Launch the game

## Features

### Level Control
- **Level Skipping**: Jump to any level (0-5) instantly
- **Level Restart**: Restart the current level
- **Quick Jump**: Use Ctrl+0-9 to jump to levels quickly

### Player Enhancements
- **God Mode**: Makes all players invincible
- **Unlimited Health**: Automatically heals players to full health
- **Fast Movement**: 2x movement speed multiplier
- **Heal All**: Instantly heal all players to full health

### Debug Tools
- **Debug Info**: Shows level, player count, enemy count, and player positions
- **Clear Enemies**: Remove all enemies from the current level
- **Spawn Test Enemy**: Add a test zombie enemy

### Visual Indicators
- Debug info panel shows current game state
- Boss health bars and phase indicators
- Player health and position tracking

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F1 | Toggle developer panel |
| F2 | Toggle debug info display |
| ESC | Close developer panel |
| Ctrl+0-9 | Quick jump to level 0-9 |

## Developer Panel

The developer panel provides a GUI interface for all developer features:

1. **Level Control Section**
   - Buttons for each level (0-5)
   - Current level indicator
   - Restart level button

2. **Player Settings Section**
   - Checkboxes for god mode, unlimited health, fast movement
   - Heal all players button

3. **Debug Options Section**
   - Toggle debug info display
   - Clear all enemies button
   - Spawn test enemy button

## Implementation Details

### Files
- `client/js/engine/DeveloperSettings.js` - Main developer settings system
- `developer-mode.html` - Developer mode control page
- `DEVELOPER_SETTINGS.md` - This documentation

### Integration
The developer settings are integrated into the main GameEngine:
- Updates during game loop for continuous effects
- Renders debug info overlay
- Modifies player properties (speed, invincibility)
- Provides level management controls

### Player Modifications
When developer settings are active, players gain additional properties:
- `isInvincible` - Prevents damage when god mode is enabled
- `speedMultiplier` - Multiplies movement speed (default 1.0, fast mode 2.0)

### Safety
- Developer mode is disabled by default
- Must be explicitly enabled via URL parameter or localStorage
- Visual indicators show when developer mode is active
- All modifications are temporary and don't affect save data

## Usage Examples

### Testing Level 2 Boss Fight
1. Enable developer mode
2. Press F1 to open developer panel
3. Click "Level 2" button
4. Enable god mode for easier testing
5. Test boss mechanics without dying

### Debugging Player Movement
1. Enable developer mode
2. Press F2 to show debug info
3. Move players around and observe position tracking
4. Enable fast movement to test collision detection

### Testing Sacrifice Mechanics
1. Jump to Level 2
2. Enable god mode to survive boss fight
3. Test elevator and button interactions
4. Observe player elimination mechanics

## Disabling Developer Mode

### Method 1: Developer Page
1. Open `developer-mode.html`
2. Click "Disable Developer Mode"
3. Refresh the game

### Method 2: Console
1. Open browser console (F12)
2. Run: `localStorage.removeItem('devMode')`
3. Refresh the page

### Method 3: Clear Browser Data
Clear localStorage for the site to reset all settings.