require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');
const { Announcement } = require('../models/Others');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evorax';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Event.deleteMany({});
  await Announcement.deleteMany({});

  // Create admin
  const admin = new User({
    name: 'ප්‍රධාන පරිපාලක',
    email: process.env.ADMIN_EMAIL || 'admin@evorax.lk',
    password: process.env.ADMIN_PASSWORD || 'Admin@2024',
    role: 'admin',
    school: 'EvoraX National School'
  });
  await admin.save();
  console.log('Admin created');

  // Demo users
  const users = [
    { name: 'ආරියරත්න ද සිල්වා', email: 'ariyaratna@student.evorax.lk', password: 'Student@123', role: 'student', grade: '12' },
    { name: 'කමලී පෙරේරා', email: 'kamali@student.evorax.lk', password: 'Student@123', role: 'student', grade: '11' },
    { name: 'නිශාන් ජයවර්ධන', email: 'nishan@teacher.evorax.lk', password: 'Teacher@123', role: 'teacher' },
    { name: 'සංජීව ගුණරත්න', email: 'sanjeewa@parent.evorax.lk', password: 'Parent@123', role: 'parent' },
  ];
  for (const u of users) { await new User(u).save(); }
  console.log('Demo users created');

  // Create events
  const now = new Date();
  const events = [
    {
      title: 'Inter-School Debate Championship 2025',
      titleSinhala: 'අන්තර් පාසල් විවාද ශූරතාවලිය 2025',
      description: 'The prestigious annual inter-school debate competition bringing together the brightest minds from over 30 schools across Colombo. Students compete in Sinhala, Tamil, and English categories.',
      descriptionSinhala: 'කොළඹ දිස්ත්‍රික්කයේ ප්‍රමුඛ පාසල් 30කට අධික ගණනක් එක් කරගනිමින් පවත්වනු ලබන ගෞරවාන්විත වාර්ෂික අන්තර් පාසල් විවාද තරඟය.',
      category: 'debate',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      time: '9:00 AM',
      venue: 'ශ්‍රී සුමංගල ශ්‍රවණාගාරය, Colombo 10',
      venueSinhala: 'ශ්‍රී සුමංගල ශ්‍රවණාගාරය',
      location: { address: 'Bauddhaloka Mawatha', city: 'කොළඹ' },
      organizer: 'Western Province Education Department',
      capacity: 200,
      ticketPrice: 0,
      featured: true,
      status: 'upcoming',
      tags: ['debate', 'competition', 'academic'],
      prizes: [{ place: '1st Place', prize: 'LKR 50,000 + Trophy' }, { place: '2nd Place', prize: 'LKR 30,000 + Trophy' }]
    },
    {
      title: 'EvoraX Annual Sports Meet 2025',
      titleSinhala: 'විදුහල වාර්ෂික ක්‍රීඩා උළෙල 2025',
      description: 'The grand annual sports meet featuring track and field events, team sports, and cultural performances. All students from Grade 1 to 13 participate in this two-day spectacular event.',
      descriptionSinhala: 'ශ්‍රේණිය 1 සිට 13 දක්වා සිසු දරුවන් සහභාගී වන දෙදින ක්‍රීඩා උළෙල.',
      category: 'sports',
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      time: '7:30 AM',
      venue: 'Sugathadasa Indoor Stadium, Colombo 10',
      venueSinhala: 'සුගතදාස ක්‍රීඩාංගනය, කොළඹ 10',
      location: { address: 'Sugathadasa Mawatha, Colombo 10', city: 'කොළඹ' },
      organizer: 'Sports Department, EvoraX',
      capacity: 500,
      ticketPrice: 100,
      featured: true,
      status: 'upcoming',
      tags: ['sports', 'athletics', 'annual'],
      prizes: [{ place: 'Overall Champion House', prize: 'Gold Shield' }]
    },
    {
      title: 'Science & Technology Exhibition',
      titleSinhala: 'විද්‍යා හා තාක්ෂණ ප්‍රදර්ශනය',
      description: 'Students showcase their innovative science projects, robotics, and technology inventions. Open to public. Judges from leading Sri Lankan universities will evaluate projects.',
      descriptionSinhala: 'ශිෂ්‍යයන්ගේ නව නිර්මාණ ව්‍යාපෘති, රොබොටික්ස් සහ තාක්ෂණ නිෂ්පාදන ප්‍රදර්ශනය.',
      category: 'science',
      date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      time: '8:00 AM',
      venue: 'National Museum of Natural History, Colombo 7',
      venueSinhala: 'ජාතික ස්වාභාවික ඉතිහාස කෞතුකාගාරය, කොළඹ 07',
      location: { address: 'Sir Marcus Fernando Mawatha, Colombo 7', city: 'කොළඹ' },
      organizer: 'Science Department',
      capacity: 300,
      ticketPrice: 0,
      featured: true,
      status: 'upcoming',
      tags: ['science', 'technology', 'innovation', 'exhibition']
    },
    {
      title: 'Sinhala New Year Cultural Festival',
      titleSinhala: 'සිංහල අවුරුදු සංස්කෘතික උළෙල',
      description: 'A vibrant celebration of Sri Lankan heritage with traditional games, food stalls, cultural performances, and traditional New Year rituals. Families are welcome!',
      descriptionSinhala: 'සිංහල ජනතාවගේ සාම්ප්‍රදායික ක්‍රීඩා, ආහාර, සංස්කෘතික ප්‍රසංගය සහ රීති සිරිත් සමඟ උළෙල.',
      category: 'cultural',
      date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      time: '10:00 AM',
      venue: 'School Grounds, EvoraX National School',
      venueSinhala: 'EvoraX National School් පිටිය',
      location: { address: 'EvoraX Mawatha, Colombo 5', city: 'කොළඹ' },
      organizer: 'Cultural Activities Committee',
      capacity: 600,
      ticketPrice: 200,
      featured: true,
      status: 'upcoming',
      tags: ['sinhala', 'new year', 'cultural', 'family']
    },
    {
      title: 'Music & Arts Gala Night',
      titleSinhala: 'සංගීත හා කලා ගාලා රාත්‍රිය',
      description: 'An evening of exceptional performances featuring school choir, orchestra, solo performances, and an art exhibition. Black-tie optional event celebrating student talent.',
      descriptionSinhala: 'ශිෂ්‍ය ප්‍රතිභාව සමරන ශ්‍රේෂ්ඨ සංගීත හා කලා ප්‍රසංගය.',
      category: 'music',
      date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      time: '6:00 PM',
      venue: 'Lionel Wendt Theatre, Colombo 7',
      venueSinhala: 'ලයනල් වෙන්ඩ් රංගහල, කොළඹ 07',
      location: { address: '18 Guildford Crescent, Colombo 7', city: 'කොළඹ' },
      organizer: 'Music & Arts Department',
      capacity: 350,
      ticketPrice: 500,
      featured: false,
      status: 'upcoming',
      tags: ['music', 'arts', 'performance', 'gala']
    },
    {
      title: 'Grade 13 Drama Performance',
      titleSinhala: '13 ශ්‍රේණිය නාට්‍ය ප්‍රදර්ශනය',
      description: 'The Grade 13 drama class presents "Maname" — a classic Sinhala drama. Three nights of enchanting performance featuring 45 student cast members.',
      descriptionSinhala: '"මනමේ" — සිංහල නාට්‍ය කලාවේ ශ්‍රේෂ්ඨ කෘතිය 13 ශ්‍රේණියේ ශිෂ්‍යයන් විසින් රඟ දක්වනු ලැබේ.',
      category: 'drama',
      date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      time: '7:00 PM',
      venue: 'John de Silva Memorial Theatre, Colombo 1',
      venueSinhala: 'ජෝන් ද සිල්වා රංගහල, කොළඹ 01',
      location: { address: 'Racecourse Avenue, Colombo 7', city: 'කොළඹ' },
      organizer: 'Drama Club',
      capacity: 400,
      ticketPrice: 300,
      status: 'upcoming',
      tags: ['drama', 'theatre', 'sinhala', 'grade13']
    }
  ];

  for (const e of events) {
    await new Event({ ...e, createdBy: admin._id }).save();
  }
  console.log('Events created');

  // Announcements
  const announcements = [
    {
      title: 'Sports Meet Registration Open',
      titleSinhala: 'ක්‍රීඩා උළෙල ලියාපදිංචිය ආරම්භ වී ඇත',
      content: 'Registration for the Annual Sports Meet 2025 is now open. All students must register by June 20th through the online portal.',
      contentSinhala: 'වාර්ෂික ක්‍රීඩා උළෙල 2025 සඳහා ලියාපදිංචිය ආරම්භ වී ඇත. සියලු සිසු දරුවන් ජූනි 20 වන දිනට ප්‍රථම ලියාපදිංචි විය යුතුය.',
      type: 'event',
      isPinned: true,
      priority: 10,
      targetAudience: ['all'],
      createdBy: admin._id
    },
    {
      title: 'School Holiday Notice',
      titleSinhala: 'පාසල් නිවාඩු දැනුම්දීම',
      content: 'The school will be closed on July 1st for a public holiday. All scheduled activities are postponed to the following week.',
      contentSinhala: 'ජූලි 1 වන දින රජයේ නිවාඩු දිනය සඳහා පාසල වසා ඇත.',
      type: 'holiday',
      isPinned: false,
      priority: 5,
      targetAudience: ['all'],
      createdBy: admin._id
    },
    {
      title: 'Science Exhibition Project Submissions',
      titleSinhala: 'විද්‍යා ප්‍රදර්ශනය ව්‍යාපෘති ඉදිරිපත් කිරීම',
      content: 'Students interested in participating in the Science & Technology Exhibition must submit their project proposals to the Science Department by June 15th.',
      type: 'event',
      isPinned: false,
      priority: 8,
      targetAudience: ['students', 'teachers'],
      createdBy: admin._id
    }
  ];

  for (const a of announcements) { await new Announcement(a).save(); }
  console.log('Announcements created');

  console.log('\n✅ Seed completed successfully!');
  console.log('Admin login: admin@evorax.lk / Admin@2024');
  console.log('Student login: ariyaratna@student.evorax.lk / Student@123');
  mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
