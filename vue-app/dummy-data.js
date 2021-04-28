// const project = {
//   id: string; // Address or another ID depending on registry implementation
//   address: string;
//   name: string;
//   tagline?: string;
//   description: string;
//   category?: string;
//   problemSpace?: string;
//   plans?: string;
//   teamName?: string;
//   teamDescription?: string;
//   githubUrl?: string;
//   radicleUrl?: string;
//   websiteUrl?: string;
//   twitterUrl?: string;
//   discordUrl?: string;
//   bannerImageUrl?: string;
//   thumbnailImageUrl?: string;
//   imageUrl?: string; // TODO remove
//   index: number;
//   isHidden: boolean; // Hidden from the list (does not participate in round)
//   isLocked: boolean; // Visible, but contributions are not allowed
//   extra?: any; // Registry-specific data
// }

const payload = { 
  updatedData: {
    furthestStep: 5,
    fund: { 
      address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      plans: 'asd',
    },
    image: {
      bannerHash: 'QmP4qZzXSZpC7sHmsKwYfxZVAzp9tZiDGEpNKzUwA4YzEt',
      thumbnailHash: 'QmP4qZzXSZpC7sHmsKwYfxZVAzp9tZiDGEpNKzUwA4YzEt',
    },
    links: {
      discord: '',
      github: 'https://github.com/ethereum/clrfund/pull/22',
      hasLink: true,
      radicle: '',
      twitter: '',
      website: '',
    },
    project: { 
      category: 'Data',
      description: 'asdf',
      name: 'asdf',
      problemSpace: 'sadf',
      tagline: 'asdf',
    },
    team: {
      description: 'asdf',
      email: 'glr3home@gmail.com',
      name: 'asdf',
    },
  },
  step: 'image',
  stepNumber: 4,
}

const recipient = {
  furthestStep: 5,
  fund: { 
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    plans: 'asd',
  },
  image: {
    bannerHash: 'QmP4qZzXSZpC7sHmsKwYfxZVAzp9tZiDGEpNKzUwA4YzEt',
    thumbnailHash: 'QmP4qZzXSZpC7sHmsKwYfxZVAzp9tZiDGEpNKzUwA4YzEt',
  },
  links: {
    discord: '',
    github: 'https://github.com/ethereum/clrfund/pull/22',
    hasLink: true,
    radicle: '',
    twitter: '',
    website: '',
  },
  project: { 
    category: 'Data',
    description: 'asdf',
    name: 'asdf',
    problemSpace: 'sadf',
    tagline: 'asdf',
  },
  team: {
    description: 'asdf',
    email: 'glr3home@gmail.com',
    name: 'asdf',
  },
},