import type { CopyRegistry } from './fields';

// The menu and the footer. Shared, because both apps draw a menu and both mount the editor.
export const navigationRegistry: CopyRegistry = {
  "page": "navigation",
  "label": "Navigation and Footer",
  "entries": {
    "nav.events": {
      "value": "Events",
      "label": "Events link",
      "hint": "The menu label for the events listing. The page lives at /events whatever you call it here.",
      "group": "The top-level menu"
    },
    "nav.coaching": {
      "value": "Coaching",
      "label": "Coaching link",
      "hint": "What you call the service you sell. Many freelancers prefer Services or Consulting. The page lives at /coaching whatever you call it here.",
      "group": "The top-level menu"
    },
    "nav.about": {
      "value": "About",
      "label": "About link",
      "hint": "The menu label for the about page",
      "group": "The top-level menu"
    },
    "nav.contact": {
      "value": "Contact",
      "label": "Contact link",
      "hint": "The menu label for the contact page",
      "group": "The top-level menu"
    },
    "nav.testimonials": {
      "value": "Testimonials",
      "label": "Testimonials link",
      "hint": "The menu label for the testimonials page",
      "group": "The top-level menu"
    },
    "nav.resources": {
      "value": "Resources",
      "label": "Resources menu",
      "hint": "The drop-down that gathers the blog, the knowledge base and anything else switched on",
      "group": "The Resources menu"
    },
    "nav.resources.visible": {
      "value": "",
      "label": "Show the Resources menu, and everything in it",
      "hint": "The whole drop-down, not one page in it. Off, and all five go at once, along with the menu itself. To hide a single page, use the switch under that page's own label below. The pages stay reachable by their own addresses either way.",
      "type": "switch",
      "store": "column",
      "path": "show_resources",
      "group": "The Resources menu"
    },
    "nav.knowledge": {
      "value": "Knowledge Base",
      "label": "Knowledge base link",
      "hint": "Inside the Resources drop-down",
      "group": "Inside Resources"
    },
    "nav.knowledge.visible": {
      "value": "",
      "label": "Show the knowledge base",
      "hint": "Off, and the knowledge base leaves the menu and answers Not Found for everybody except you. The other items in Resources are unaffected.",
      "type": "switch",
      "store": "column",
      "path": "show_knowledge",
      "group": "Inside Resources"
    },
    "nav.blog": {
      "value": "Blog",
      "label": "Blog link",
      "hint": "Inside the Resources drop-down",
      "group": "Inside Resources"
    },
    "nav.blog.visible": {
      "value": "",
      "label": "Show the blog",
      "hint": "Off, and the blog leaves the menu and answers Not Found for everybody except you. The other items in Resources are unaffected.",
      "type": "switch",
      "store": "column",
      "path": "show_blog",
      "group": "Inside Resources"
    },
    "nav.exams": {
      "value": "Practice Exams",
      "label": "Practice exams link",
      "hint": "Inside the Resources drop-down",
      "group": "Inside Resources"
    },
    "nav.exams.visible": {
      "value": "",
      "label": "Show the practice exams",
      "hint": "Off, and the practice exams leaves the menu and answers Not Found for everybody except you. The other items in Resources are unaffected.",
      "type": "switch",
      "store": "column",
      "path": "show_exams",
      "group": "Inside Resources"
    },
    "nav.ai_tools": {
      "value": "AI Tools",
      "label": "AI tools link",
      "hint": "Inside the Resources drop-down",
      "group": "Inside Resources"
    },
    "nav.ai_tools.visible": {
      "value": "",
      "label": "Show the AI tools",
      "hint": "Off, and the AI tools leaves the menu and answers Not Found for everybody except you. The other items in Resources are unaffected.",
      "type": "switch",
      "store": "column",
      "path": "show_ai_tools",
      "group": "Inside Resources"
    },
    "nav.flow_game": {
      "value": "Flow Game",
      "label": "Flow game link",
      "hint": "Inside the Resources drop-down",
      "group": "Inside Resources"
    },
    "nav.flow_game.visible": {
      "value": "",
      "label": "Show the flow game",
      "hint": "Off, and the flow game leaves the menu and answers Not Found for everybody except you. The other items in Resources are unaffected.",
      "type": "switch",
      "store": "column",
      "path": "show_flow_game",
      "group": "Inside Resources"
    },
    "nav.home": {
      "value": "Home",
      "label": "Home link",
      "hint": "Shown in the footer's quick links, and as the first step of the trail search engines show above a page",
      "group": "The footer"
    },
    "footer.quicklinks": {
      "value": "Quick Links",
      "label": "Footer links heading",
      "hint": "The heading above the list of links in the footer",
      "group": "The footer"
    },
    "footer.contact": {
      "value": "Contact",
      "label": "Footer contact heading",
      "hint": "The heading above the email address and phone number in the footer",
      "group": "The footer"
    },
    "footer.privacy": {
      "value": "Privacy Policy",
      "label": "Privacy link",
      "hint": "At the very bottom of every page. Only shown once the address below is filled in",
      "group": "The legal links"
    },
    "footer.privacy.href": {
      "value": "",
      "label": "Privacy page address",
      "hint": "Where your privacy notice lives, for example a page on your own site or a document you host elsewhere. Leave empty and the link is not shown.",
      "group": "The legal links"
    },
    "footer.terms": {
      "value": "Terms & Conditions",
      "label": "Terms link",
      "hint": "At the very bottom of every page. Only shown once the address below is filled in",
      "group": "The legal links"
    },
    "footer.terms.href": {
      "value": "",
      "label": "Terms page address",
      "hint": "Where your terms and conditions live. Leave empty and the link is not shown.",
      "group": "The legal links"
    },
    "footer.cookies": {
      "value": "Cookie Policy",
      "label": "Cookies link",
      "hint": "At the very bottom of every page. Only shown once the address below is filled in",
      "group": "The legal links"
    },
    "footer.cookies.href": {
      "value": "",
      "label": "Cookies page address",
      "hint": "Where your cookie policy lives. Leave empty and the link is not shown.",
      "group": "The legal links"
    },
    "nav.signIn": {
      "value": "Sign In",
      "label": "Sign in button",
      "hint": "The button at the right-hand end of the menu, for somebody who is not signed in",
      "group": "Signing in"
    },
    "nav.dashboard": {
      "value": "Dashboard",
      "label": "Dashboard button",
      "hint": "The same button, for somebody who is signed in. It takes them to their own dashboard",
      "group": "Signing in"
    },
    "nav.greeting": {
      "value": "Hi",
      "label": "Greeting",
      "hint": "Before somebody's name, beside the button, once they are signed in",
      "group": "Signing in"
    }
  }
} as CopyRegistry;
