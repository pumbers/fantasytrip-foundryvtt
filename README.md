# Fantasy Trip: In the Labyrinth for Foundry VTT by 3rdDog

This system implements the rules from <a href="https://warehouse23.com/products/the-fantasy-trip-in-the-labyrinth">Steve Jackson Games **Fantasy Trip: In the Labyrinth**</a> for Foundry VTT.

The material presented here is my original creation, intended for use with the <a href="https://www.thefantasytrip.game/"><b><i>The Fantasy Trip</i></b></a> system from <a href="http://www.sjgames.com/">Steve Jackson Games</a>. This material is not official and is not endorsed by Steve Jackson Games.

<b>The Fantasy Trip: In the Labyrinth</b> is a trademark of Steve Jackson Games, and its rules and art are copyrighted by Steve Jackson Games. All rights are reserved by Steve Jackson Games. This game aid is the original creation of Paul Umbers and is released for free distribution, and not for resale, under the permissions granted in the <a href="http://www.sjgames.com/general/online_policy.html">Steve Jackson Games Online Policy</a>.

## History

Like a lot of people, I started playing The Fantasy Trip back around 1979, first with Melee and Wizard and later with the full blown In The Labyrinth. I was also playing a fair bit of Dungeons & Dragons and Chivalry & Sorcery, but I found Fantasy Trip intriguing in its simple complexity.

It didn't have D&D's "Vancian Magic" (remember a spell, cast it, forget it), which I've disliked from day one, and it didn't have classes or levels. A character could be and do whatever you wanted without having to fit into predesignated slots. C&S was a similar in those respects, but was also an order of magnitude crunchier than D&D - and was printed using text so small I can't even read the 1st edition book these days.

Fantasy Trip filled that gap where a game was simple enough to be easy to learn and play but complex enough to create a richness of detail in the settings & adventures.

Although I hadn't played the game in over 30 years, I was pleasantly surprised when Steve Jackson Games resurrected it in 2019 with the Legacy Edition. I signed up for the full print/PDF package straight away, and was not disappointed with the end product. It brought back a lot of memories.

But, time and circumstances came along and I still didn't play the game. Then, finally in 2024, I retired and started picking up older games, including Fantasy Trip. I couldn't find a local gaming group for it, and although there was online support in Roll 20 and Owlbear Rodeo could be used generically, there wasn't a Foundry VTT implementation, and Foundry is my go-to VTT these days.

Luckily, I've spent the last 30 years as a software developer, and have even implemented a few modules & systems for friends. So, I set about implementing it for Foundry, and here's the result. Full instructions are included as a Journal within the system.

Enjoy!

## Design Notes

The design philosophy for all of the systems I've written for Foundry is not necessarily to implement each game rule or process in detail, but rather to implement key features in a way that takes the repetitive or complex tasks off of the players & GM and makes it easier for them to do the rest. I've found this gives the users a lot of freedom in how the rules are interpreted and applied without constraining them too much.

For example, I did consider having strict AP limits and XP spending for advancement, but determined that would have been complicated to implement & use, so opted for a simple AP total on the character sheet that highlights in red if a set limit is exceeded without spending XP. This gives players an indication of their AP total that they can use to determine the cost as per pp45 of the rulebook. It's up to the GM to enforce those costs or not, according to how they want the game played. XP spends for other items just use the XP total field, manually adjusted.

The same goes for the Dice Roller application. It allows players to quickly see what a dice roll is made up from (target attribute(s), modifiers, number of dice, etc) and adjust the parameters before making the roll. Buttons are provided on the character sheet that act as "presets" for attribute rolls, talent rolls, attacks & damage, spell casting, etc.

Encumbrance calculation though, is a chore, so I've automated that. A player can have as many items in their inventory as they like, they can choose each item's location (dropped, equipped, carried, stowed, stored) and the character's total encumbrance (based on carried or equipped items) is calculated automatically. That encumbrance level is shown on the character sheet and attribute penalties are applied automatically. I even added a "container" feature so that a character can put items in a backpack which counts them against encumbrance when carried, but if the backpack is dropped (say, for combat) then all the items in it are also dropped and the combat penalties come off immediately.

Hopefully, this design philosophy achieves what I set out to do: make it easy for old and new players to play the game the way they want in the way they're used to.

I'm always open to suggestions (and, of course, hearing about bugs), so please feel free to use Github Issues to let me know what you like or dislike, what I got wrong, and what you want. Bear in mind though, I'm in this for fun, not money, and sometimes life happens and I can't make changes quickly.

## Steve Jackson Online Policy

I have tried to ensure that this implementation conforms to the Steve Jackson Online Policy, and since SJG rarely recognize or allow "official" versions of their games, this is an unofficial version. This means that while I can implement the mechanisms of the game and even use some of the terminology, I cannot cut & paste any significant content from the game and distribute it. This is why I've included only a few Example Items to show how Talents, Spells, and equipment can be built, and none of those items include descriptive text from the game.

If there is content in here that infringes on SJG intellectual property or copyright, or breaks their online policy, please let me know ASAP via Github Issues.
