// Temporary stock photos from Wikimedia Commons, used until KSafaris supplies its own.
// CC BY / CC BY-SA require this credit to stay on the site while the photos are in use.
// When you replace a photo, delete its entry here. When the list is empty the credits page and
// its footer link disappear automatically.

export interface PhotoCredit {
  file: string;
  subject: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
}

export const PHOTO_CREDITS: PhotoCredit[] = [
  {
    file: 'placeholders/amboseli-kilimanjaro.jpg',
    subject: 'Amboseli National Park and Mt. Kilimanjaro',
    author: 'Ninaras',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Amboseli_National_Park_and_Mt._Kilimanjaro.jpg',
  },
  {
    file: 'placeholders/amboseli-elephant.jpg',
    subject: 'Amboseli Park, Kilimanjaro elephant',
    author: 'Lafleursauvage',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Amboseli_Park_-_Kilimanjaro_elephant.jpg',
  },
  {
    file: 'placeholders/mara-lioness-vehicle.jpg',
    subject: 'Lioness and safari vehicle in Maasai Mara National Reserve',
    author: 'Daniel Case',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source:
      'https://commons.wikimedia.org/wiki/File:Lioness_and_safari_vehicle_in_Maasai_Mara_National_Reserve,_Kenya.jpg',
  },
  {
    file: 'placeholders/mara-plains.jpg',
    subject: 'Wildebeest and Thomson gazelle in Maasai Mara, Kenya',
    author: 'Daniel Case',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Wildebeest_and_Thomson_gazelle_in_Maasai_Mara,_Kenya.jpg',
  },
  {
    file: 'placeholders/serengeti-lion.jpg',
    subject: 'Male lion prowling in the Serengeti National Park',
    author: 'Giles Laurent',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source:
      'https://commons.wikimedia.org/wiki/File:002_Male_Lion_prowling_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg',
  },
  {
    file: 'placeholders/ngorongoro-nature.jpg',
    subject: 'Nature of Ngorongoro Conservation Area',
    author: 'Zenith4237',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Nature_of_Ngorongoro_Conservation_Area_(129).jpg',
  },
  {
    file: 'placeholders/nakuru-flamingos.jpg',
    subject: 'Large number of flamingos at Lake Nakuru',
    author: 'Syllabub',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Large_number_of_flamingos_at_Lake_Nakuru.jpg',
  },
  {
    file: 'placeholders/rwanda-hills.jpg',
    subject: 'Sky view of hills of Rwanda',
    author: 'Peace Batuma',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Sky_view_of_hills_of_Rwanda.jpg',
  },
];
