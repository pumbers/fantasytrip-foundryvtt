## Release Notes for 1.3.0

**GM Note: this release includes some changes and a lot of fixes & QOL improvements. I've not made this a major release though, since there are no breaking changes as far as world or compendium data is concerned. Please make sure you have backups of your world and compendiums before upgrading and migrating world data.**

### Code Changes

- Reformatted code to improve readability
- Upgraded all library dependencies to latest versions
- Upgraded browser compatibility to latest versions
- Replaced last use of JQuery
- Converted tailwindcss to v4 form

### Bug Fixes & Changes

- Fixed error condition when item not found on edit, change location, etc
- Fixed failing natural weapon fumble check
- Fixed incorrect recognition of automatic success & failure. An exact match with a target number would result in a success if the target should actually have been an automatic success or failure. Rolling a 16 against a target of 16, for example, would have counted as a success when in fact it should be an automatic failure (FT-ItL p9).
- Fixed initiative for defeated combatants. Rolling initiative for a defeated combatant would create a console error, now that initiative is set to 0 and no other combatants are affected.
- Fixed race condition where turn order in combat wasn't waiting for all initiative rolls to complete and ordering ended up being incorrect.
- Fixed errors in standard text import and made sure the user sees an error message if it fails.
- Fixed default sorting of items that use the helper function.
- Fixed autocomplete typo in defense action field definition.
- Fixed updates to items with Active Effects that gave permission errors when toggling effects on or off (see below)
- Fixed permission errors when switching movement modes from token and/or character sheet
- Added new process and GM dialog for applying spell effects to targets the caster does not own as a player.
- Fixed slow loading of spell dropdown when there are large compendiums
- Casting from an item now names the item in chats & dialogs
- Fixed icon for new active effect and deprecation message
- Ensure item actions are edited from source data and default names are applied
- Fixed incorrect roll dialog type and console error when pmaking different rolls one after another
- Fixed incorrect attack used to show damage button on equipment with multiple attacks
- Ensure dropping an item onto a container check total wt of multiple items against the container's remaining capacity
- Ignore dropping an item into a container it's already in
- Added setting to include or exclude ST modifiers from effects when deciding if a character is dead or down
- Added setting for using base ST or adjusted ST when checking for dead or down
- Down effect is removed if character ST recovers, dead effect must be manually removed by GM

### Applying Spell Effects

Prior to this release, if a player character cast a spell against a target they did not own as a player (ie: pretty much all enemies) they would get a permissions error when trying to apply any Active Effects of the spell. The process has now changed so that if a spell is successfully cast, effects are applied automatically to any token/character owned by the player, but every other token/character is sent to a dialog for the GM to approve. The GM can approve all or select or deny specific tokens. The GM has 2 minutes to respond, after which the effects are cancelled - the spell is considered cast and effects applied to player owned characters still stand.

### Data Migration

To avoid items with Active Effects having those items toggled off with no way to reset them, the data for those items has to be changed via a migration. The migration will run automatically when the first GM loads the world. Check your browser console for details.

**PLEASE ENSURE YOU HAVE TAKEN A BACKUP OF YOUR WORLD DATA AND ANY COMPENDIUMS THAT INCLUDE FANTASY TRIP ITEMS BEFORE YOU RUN THIS MIGRATION.**
