// src/tokens.ts
var colors = {
  skyTeal: "#F0FAFA",
  paleTeal: "#D9F2F2",
  midTeal: "#007A7A",
  deepTeal: "#004D4D",
  orange: "#FF9715"};

// src/editor/site.ts
var siteRegistry = {
  "page": "site",
  "label": "This Site",
  "entries": {
    "site.managed": {
      "value": "",
      "label": "Sites you look after",
      "hint": "This site and any other built from the same software. Listed on the Sites page, which only you can see. Nothing here reaches those sites: it is a list of addresses.",
      "type": "items",
      "fields": [
        { "key": "name", "label": "What you call it", "placeholder": "Her Business", "required": true },
        { "key": "domain", "label": "Address", "placeholder": "herbusiness.com", "required": true },
        { "key": "note", "label": "Note to self", "placeholder": "Whose it is, or what is still to do" }
      ],
      "group": "Sites you look after"
    },
    "site.company_name": {
      "value": "",
      "label": "Business name",
      "hint": "Shown in the menu when there is no logo, in the footer, in the browser tab and in what Google indexes.",
      "store": "column",
      "path": "company_name",
      "group": "What this site is called"
    },
    "site.company_description": {
      "value": "",
      "label": "One-line description",
      "hint": "The sentence under the name in the footer, and what search engines quote. One sentence works best.",
      "store": "column",
      "path": "company_description",
      "group": "What this site is called"
    },
    "site.copyright_text": {
      "value": "",
      "label": "Copyright line",
      "hint": "After the year and the business name at the very bottom.",
      "store": "column",
      "path": "copyright_text",
      "group": "What this site is called"
    },
    "site.under_construction": {
      "value": "",
      "label": "Show visitors a holding page",
      "hint": "On, and anybody who is not signed in as an administrator sees the holding page below instead of the site. You still see the real site, so it can be finished while it is hidden. Search engines are told not to index it while this is on.",
      "type": "switch",
      "store": "column",
      "path": "under_construction",
      "group": "Not ready yet",
      "says": { "on": "Visitors see a holding page", "off": "The site is public" }
    },
    "site.construction.heading": {
      "value": "Something is on its way",
      "label": "Holding page heading",
      "hint": "Shown only while the switch above is on.",
      "group": "Not ready yet"
    },
    "site.construction.body": {
      "value": "This site is being put together. Do come back soon.",
      "label": "Holding page message",
      "hint": "A sentence or two under the heading. If you have set a contact email on this tab, it is offered underneath so somebody who needs you now still can reach you.",
      "type": "textarea",
      "group": "Not ready yet"
    },
    "site.show_bookings": {
      "value": "",
      "label": "Bookings",
      "hint": "Taking appointments against your availability. Off unless you actually want people booking time with you from the site.",
      "type": "switch",
      "store": "column",
      "path": "show_bookings",
      "group": "What this site includes"
    },
    "site.show_dynamic_pages": {
      "value": "",
      "label": "Extra pages",
      "hint": "Pages you build yourself from content blocks, each at its own address. Off, and only the pages listed above exist.",
      "type": "switch",
      "store": "column",
      "path": "show_dynamic_pages",
      "group": "What this site includes"
    },
    "site.show_protected_projects": {
      "value": "",
      "label": "Projects",
      "hint": "Projects, their artifacts and the backlog, for working with a client rather than for visitors to read.",
      "type": "switch",
      "store": "column",
      "path": "show_protected_projects",
      "group": "What this site includes"
    },
    "site.show_dashboard": {
      "value": "",
      "label": "Dashboard",
      "hint": "The page somebody lands on after signing in. Off, and signing in takes them back to where they were.",
      "type": "switch",
      "store": "column",
      "path": "show_dashboard",
      "group": "What this site includes"
    },
    "site.show_zoo_game": {
      "value": "",
      "label": "Zoo Game",
      "hint": "The Scrum teaching game, at /zoo-game.",
      "type": "switch",
      "store": "column",
      "path": "show_zoo_game",
      "group": "What this site includes"
    },
    "site.show_scrum_game": {
      "value": "",
      "label": "Scrum Game",
      "hint": "The earlier Scrum simulation.",
      "type": "switch",
      "store": "column",
      "path": "show_scrum_game",
      "group": "What this site includes"
    },
    "site.show_recommendations": {
      "value": "",
      "label": "Suggested reading",
      "hint": 'The "you might also like" panel under blog posts and techniques. A page with nothing to suggest shows nothing either way.',
      "type": "switch",
      "store": "column",
      "path": "show_recommendations",
      "says": { "on": "Shown under posts", "off": "Not shown" },
      "group": "What this site includes"
    },
    "site.brand.images.logo": {
      "value": "",
      "label": "Logo",
      "hint": "Top left of every page. Leave it empty and the business name is used as words, which often looks better than a stretched image.",
      "type": "image",
      "store": "brand",
      "path": "images.logo",
      "group": "Logo and pictures"
    },
    "site.brand.wordmark.twoTone": {
      "value": "",
      "label": "Two-tone wordmark",
      "hint": "Only used when no logo is uploaded. Sets the business name in capitals with the last word in your accent colour, which reads as a designed mark rather than as text. Check it before leaving it on: a one-word name written as two, like StreamStrategy, comes apart correctly, but so does a name like McKenzie.",
      "type": "switch",
      "store": "brand",
      "path": "wordmark.twoTone",
      "says": { "on": "Name set in two colours", "off": "Name set plainly" },
      "group": "Logo and pictures"
    },
    "site.brand.images.favicon": {
      "value": "",
      "label": "Browser tab icon",
      "hint": "The small square in the browser tab and in a bookmark.",
      "type": "image",
      "store": "brand",
      "path": "images.favicon",
      "group": "Logo and pictures"
    },
    "site.brand.images.ogImage": {
      "value": "",
      "label": "Social sharing picture",
      "hint": "What appears when somebody pastes a link to this site into Slack, LinkedIn or a message. Wide, around 1200 by 630.",
      "type": "image",
      "store": "brand",
      "path": "images.ogImage",
      "group": "Logo and pictures"
    },
    "site.brand.images.founderPhoto": {
      "value": "",
      "label": "Founder photograph",
      "hint": "The photograph on the home page and the about page.",
      "type": "image",
      "store": "brand",
      "path": "images.founderPhoto",
      "group": "The founder"
    },
    "site.brand.images.founderPortrait": {
      "value": "",
      "label": "Founder portrait",
      "hint": "The smaller cut-out used beside the closing call to action.",
      "type": "image",
      "store": "brand",
      "path": "images.founderPortrait",
      "group": "The founder"
    },
    "site.brand.fonts.heading": {
      "value": "dm-serif",
      "label": "Heading typeface",
      "hint": "Headings, and the wordmark when no logo is uploaded.",
      "type": "choice",
      "store": "brand",
      "path": "fonts.heading",
      "group": "Type",
      "options": [
        { "value": "dm-serif", "label": "DM Serif Display", "note": "Warm and editorial. Good for headings, heavy going for paragraphs." },
        { "value": "dm-sans", "label": "DM Sans", "note": "Plain and modern. Reads well at any size." },
        { "value": "georgia", "label": "Georgia", "note": "A classic serif, already on nearly every device. Steady and unshowy." },
        { "value": "system", "label": "The reader\u2019s own", "note": "Whatever their device uses. The fastest to load and the least distinctive." }
      ]
    },
    "site.brand.fonts.body": {
      "value": "dm-sans",
      "label": "Body typeface",
      "hint": "Everything that is not a heading. Worth choosing the plainer of two: this is the one people actually read.",
      "type": "choice",
      "store": "brand",
      "path": "fonts.body",
      "group": "Type",
      "options": [
        { "value": "dm-sans", "label": "DM Sans", "note": "Plain and modern. Reads well at any size." },
        { "value": "georgia", "label": "Georgia", "note": "A classic serif, already on nearly every device. Steady and unshowy." },
        { "value": "system", "label": "The reader\u2019s own", "note": "Whatever their device uses. The fastest to load and the least distinctive." },
        { "value": "dm-serif", "label": "DM Serif Display", "note": "Warm and editorial. Good for headings, heavy going for paragraphs." }
      ]
    },
    "site.brand.colors.orange": {
      "value": colors.orange,
      "label": "Accent colour",
      "hint": "Used across the whole site. Changing it changes every page at once.",
      "type": "colour",
      "store": "brand",
      "path": "colors.orange",
      "group": "Colours"
    },
    "site.brand.colors.deepTeal": {
      "value": colors.deepTeal,
      "label": "Deep colour",
      "hint": "Used across the whole site. Changing it changes every page at once.",
      "type": "colour",
      "store": "brand",
      "path": "colors.deepTeal",
      "group": "Colours"
    },
    "site.brand.colors.midTeal": {
      "value": colors.midTeal,
      "label": "Mid colour",
      "hint": "Used across the whole site. Changing it changes every page at once.",
      "type": "colour",
      "store": "brand",
      "path": "colors.midTeal",
      "group": "Colours"
    },
    "site.brand.colors.skyTeal": {
      "value": colors.skyTeal,
      "label": "Pale colour",
      "hint": "Used across the whole site. Changing it changes every page at once.",
      "type": "colour",
      "store": "brand",
      "path": "colors.skyTeal",
      "group": "Colours"
    },
    "site.brand.colors.paleTeal": {
      "value": colors.paleTeal,
      "label": "Palest colour",
      "hint": "Used across the whole site. Changing it changes every page at once.",
      "type": "colour",
      "store": "brand",
      "path": "colors.paleTeal",
      "group": "Colours"
    },
    "site.show_founder": {
      "value": "",
      "label": "Show the founder",
      "hint": "Off, and no photograph, biography or Person data appears anywhere. A business that does not lead with a person should leave this off.",
      "type": "switch",
      "store": "column",
      "path": "show_founder",
      "group": "The founder"
    },
    "site.founder_name": {
      "value": "",
      "label": "Founder name",
      "hint": "Used in the alt text of the photograph and in the structured data search engines read. The words about the founder are edited where they appear: open the home page or the about page and look under Founder on the This Page tab.",
      "store": "column",
      "path": "founder_name",
      "group": "The founder"
    },
    "site.founder_role": {
      "value": "",
      "label": "Founder job title",
      "hint": 'For search engines, for example "Agile Coach". Leave empty to claim none.',
      "store": "column",
      "path": "founder_role",
      "group": "The founder"
    },
    "site.founder_expertise": {
      "value": "",
      "label": "What the founder is known for",
      "hint": "One per line, for search engines. These are claims about a named person, so only list what is true.",
      "type": "textarea",
      "store": "column",
      "path": "founder_expertise",
      "group": "The founder"
    },
    "site.contact_email": {
      "value": "",
      "label": "Email address",
      "hint": "Shown in the footer and on the contact page.",
      "store": "column",
      "path": "contact_email",
      "group": "How to reach you"
    },
    "site.contact_phone": {
      "value": "",
      "label": "Telephone",
      "hint": "Leave empty and no number appears.",
      "store": "column",
      "path": "contact_phone",
      "group": "How to reach you"
    },
    "site.contact_location": {
      "value": "",
      "label": "Where you are",
      "hint": 'For example "Manchester, United Kingdom".',
      "store": "column",
      "path": "contact_location",
      "group": "How to reach you"
    },
    "site.social_linkedin": {
      "value": "",
      "label": "LinkedIn address",
      "hint": "The full web address. Leave empty and the icon does not appear.",
      "store": "column",
      "path": "social_linkedin",
      "group": "Social links"
    },
    "site.social_twitter": {
      "value": "",
      "label": "Twitter address",
      "hint": "The full web address. Leave empty and the icon does not appear.",
      "store": "column",
      "path": "social_twitter",
      "group": "Social links"
    },
    "site.social_facebook": {
      "value": "",
      "label": "Facebook address",
      "hint": "The full web address. Leave empty and the icon does not appear.",
      "store": "column",
      "path": "social_facebook",
      "group": "Social links"
    },
    "site.social_youtube": {
      "value": "",
      "label": "YouTube address",
      "hint": "The full web address. Leave empty and the icon does not appear.",
      "store": "column",
      "path": "social_youtube",
      "group": "Social links"
    },
    "site.social_github": {
      "value": "",
      "label": "GitHub address",
      "hint": "The full web address. Leave empty and the icon does not appear.",
      "store": "column",
      "path": "social_github",
      "group": "Social links"
    }
  }
};

export { siteRegistry };
