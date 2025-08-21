import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.gameSession.deleteMany()
  await prisma.moldAssignment.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.scene.deleteMany()
  await prisma.gameMold.deleteMany()
  await prisma.childProfile.deleteMany()
  await prisma.user.deleteMany()

  // Create a demo user (parent/therapist)
  const hashedPassword = await bcrypt.hash('demo123', 12)
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@brainberry.com',
      password: hashedPassword,
      name: 'Dr. Sarah Johnson',
      role: 'THERAPIST',
      phone: '(555) 123-4567',
      license: 'LIC-12345',
      organization: 'Bright Minds Therapy Center'
    }
  })
  console.log(`✅ Created demo user: ${demoUser.name}`)

  // Helper function to generate 6-digit access code
  function generateAccessCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Create children
  const children = [
    { name: 'Alice', age: 7, diagnosis: 'ASD', notes: 'Responds well to visual cues' },
    { name: 'Bobby', age: 8, diagnosis: 'ADHD', notes: 'Benefits from shorter sessions' },
    { name: 'Chloe', age: 9, diagnosis: 'ASD', notes: 'Enjoys routine and predictability' },
    { name: 'David', age: 10, diagnosis: 'ADHD', notes: 'Highly creative and energetic' }
  ]

  const createdChildren = []
  for (const child of children) {
    const created = await prisma.childProfile.create({
      data: {
        ...child,
        accessCode: generateAccessCode(),
        userId: demoUser.id
      }
    })
    createdChildren.push(created)
    console.log(`✅ Created child: ${child.name} (access code: ${created.accessCode})`)
  }

  // Create game molds
  const molds = [
    {
      name: 'Memory Palace Adventure',
      category: 'Memory',
      structureType: 'linear',
      experienceType: 'puzzle',
      primaryObjective: 'Strengthen working memory through spatial navigation and object recall',
      rules: 'Navigate through different rooms and remember the placement of treasures. Each level increases memory load.',
      lockStructure: false,
      allowThemes: true,
      allowPacing: true,
      allowRewards: true,
      allowAvatars: true,
      customizationNotes: 'Palace theme can be changed to castle, spaceship, or underwater base',
      ageMin: 6,
      ageMax: 12,
      difficulty: 'Medium',
      learnerProfiles: 'ASD,ADHD',
      executiveFunctionTargets: 'working memory,visual-spatial processing',
      sensoryPreferences: 'visual,low-audio',
      skillTargets: 'memory,spatial awareness,attention',
      scenes: [
        {
          title: 'Palace Entrance',
          narrative: 'Welcome, brave explorer! You have discovered an ancient memory palace filled with magical treasures.',
          instructions: 'Look around the entrance hall and remember where you see each golden object.',
          pacingCalm: true,
          pacingFast: false,
          reinforcement: 'visual',
          assets: [
            { type: 'image', label: 'Palace Gate', url: '/assets/palace-gate.jpg' },
            { type: 'sound', label: 'Welcome Music', url: '/assets/welcome.mp3' }
          ]
        },
        {
          title: 'Treasure Room',
          narrative: 'You have entered the main treasure chamber. Can you remember which treasures you saw at the entrance?',
          instructions: 'Click on the treasures you remember seeing in the entrance hall.',
          pacingCalm: false,
          pacingFast: false,
          reinforcement: 'token',
          assets: [
            { type: 'image', label: 'Treasure Room', url: '/assets/treasure-room.jpg' },
            { type: 'sound', label: 'Success Sound', url: '/assets/success.mp3' }
          ]
        }
      ]
    },
    {
      name: 'Emotion Detective',
      category: 'Social Skills',
      structureType: 'branching',
      experienceType: 'story',
      primaryObjective: 'Develop emotional recognition and social understanding through interactive stories',
      rules: 'Help characters solve social situations by identifying emotions and choosing appropriate responses.',
      lockStructure: false,
      allowThemes: true,
      allowPacing: true,
      allowRewards: true,
      allowAvatars: true,
      customizationNotes: 'Characters can be customized for different cultural backgrounds',
      ageMin: 7,
      ageMax: 14,
      difficulty: 'Easy',
      learnerProfiles: 'ASD,ADHD,HYBRID',
      executiveFunctionTargets: 'emotional regulation,social cognition',
      sensoryPreferences: 'visual,medium-audio',
      skillTargets: 'emotion recognition,empathy,social problem solving',
      scenes: [
        {
          title: 'School Playground',
          narrative: 'Maya is sitting alone on the playground bench. She looks sad because her friend Emma walked away.',
          instructions: 'Look at Maya\'s face and body language. How do you think she is feeling?',
          pacingCalm: true,
          pacingFast: false,
          reinforcement: 'calming-loop',
          assets: [
            { type: 'image', label: 'Playground Scene', url: '/assets/playground.jpg' },
            { type: 'sound', label: 'Ambient Playground', url: '/assets/playground-ambient.mp3' }
          ]
        },
        {
          title: 'Making Friends',
          narrative: 'You decide to help Maya feel better. What would be the best way to approach her?',
          instructions: 'Choose the kindest way to help Maya. Think about how you would want to be treated.',
          pacingCalm: true,
          pacingFast: false,
          reinforcement: 'visual',
          assets: [
            { type: 'image', label: 'Friendship Options', url: '/assets/friendship.jpg' },
            { type: 'sound', label: 'Gentle Music', url: '/assets/gentle.mp3' }
          ]
        }
      ]
    }
  ]

  const createdMolds = []
  for (const mold of molds) {
    const { scenes, ...moldData } = mold
    const created = await prisma.gameMold.create({
      data: {
        ...moldData,
        scenes: {
          create: (scenes as any[]).map((scene: any, index: number) => ({
            index,
            title: scene.title,
            narrative: scene.narrative,
            instructions: scene.instructions,
            pacingCalm: scene.pacingCalm,
            pacingFast: scene.pacingFast,
            reinforcement: scene.reinforcement,
            assets: {
              create: scene.assets.map((asset: any) => ({
                type: asset.type,
                label: asset.label,
                url: asset.url
              }))
            }
          }))
        }
      },
      include: { scenes: { include: { assets: true } } }
    })
    createdMolds.push(created)
    console.log(`✅ Created mold: ${mold.name} with ${created.scenes.length} scenes`)
  }

  // Create assignments (assign specific games to specific children)
  const assignments = [
    { childId: createdChildren[0].id, moldId: createdMolds[0].id }, // Alice gets Memory Palace
    { childId: createdChildren[0].id, moldId: createdMolds[1].id }, // Alice gets Emotion Detective
    { childId: createdChildren[1].id, moldId: createdMolds[1].id }, // Bobby gets Emotion Detective
    { childId: createdChildren[2].id, moldId: createdMolds[0].id }, // Chloe gets Memory Palace
    { childId: createdChildren[3].id, moldId: createdMolds[0].id }, // David gets Memory Palace
    { childId: createdChildren[3].id, moldId: createdMolds[1].id }, // David gets Emotion Detective
  ]

  for (const assignment of assignments) {
    await prisma.moldAssignment.create({
      data: {
        childId: assignment.childId,
        moldId: assignment.moldId,
        progress: Math.floor(Math.random() * 50), // Random progress 0-50%
        status: 'active'
      }
    })
  }
  console.log(`✅ Created ${assignments.length} game assignments`)

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📝 Demo credentials:')
  console.log('Email: demo@brainberry.com')
  console.log('Password: demo123')
  console.log('\n🧒 Child access codes:')
  createdChildren.forEach(child => {
    console.log(`${child.name}: ${child.accessCode}`)
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
