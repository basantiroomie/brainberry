import { Mountain, Calendar, MapPin, Instagram, Facebook, Twitter } from "lucide-react"
import Image from "next/image"

export default function JamRockClimbers() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black shadow-brutal-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Mountain className="h-8 w-8 text-black" />
              <span className="text-xl font-bold text-black">JAM ROCK CLIMBERS</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-black hover:text-main font-medium">
                About
              </a>
              <a href="#events" className="text-black hover:text-main font-medium">
                Events
              </a>
              <a href="#join" className="text-black hover:text-main font-medium">
                Join
              </a>
              <a href="#community" className="text-black hover:text-main font-medium">
                Community
              </a>
              <button className="bg-main text-main-foreground px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
                JOIN THE CLUB
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/hero-climber.png" alt="Rock climber on cliff face" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-overlay"></div>
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <div className="border-4 border-border shadow-brutal-3xl p-8 transform -rotate-1">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 leading-none">CLIMB BOLD.</h1>
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-none">LIVE FREE.</h1>
            </div>
          </div>
          <div>
            <div className="border-4 border-border shadow-brutal-2xl p-6 transform rotate-1">
              <p className="text-xl md:text-2xl text-white font-medium mb-6">
                Welcome to Jam Rock Climbers — your community for vertical adventure.
              </p>
              <button className="bg-chart-2 text-white px-8 py-4 border-4 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-lg">
                SEE UPCOMING EVENTS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div>
                <div className="bg-chart-1 border-4 border-border shadow-brutal-colored-lg p-4 inline-block mb-8 transform -rotate-1">
                  <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">WHO WE ARE</h2>
                </div>
              </div>
              <div>
                <div className="space-y-6">
                  <p className="text-xl font-medium text-foreground">We climb hard. We support harder.</p>
                  <p className="text-lg font-medium text-foreground">
                    Jam Rock Climbers welcomes all skill levels. From first-time boulderers to seasoned trad leaders.
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    Our mission: Build community through vertical challenges. Push limits. Share stoke.
                  </p>
                  <div className="bg-chart-4 border-4 border-border shadow-brutal-xl p-6">
                    <p className="text-main-foreground font-bold text-lg">
                      10+ years building the local climbing scene
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div>
                <div className="bg-black border-4 border-border shadow-brutal-3xl p-8 transform rotate-2 hover:shadow-[24px_24px_0px_0px_var(--color-border)] transition-all duration-300">
                  <Image
                    src="/climbing-community.png"
                    alt="Climbing community"
                    width={500}
                    height={400}
                    className="border-2 border-border"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 bg-secondary-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="bg-chart-2 border-4 border-border shadow-brutal-colored-xl p-4 inline-block mb-12 transform rotate-1">
              <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">UPCOMING EVENTS</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "WEEKEND WARRIOR", date: "SAT JAN 20", location: "RED ROCKS" },
              { name: "BEGINNER BELAY", date: "WED JAN 24", location: "LOCAL GYM" },
              { name: "TRAD CLINIC", date: "SUN JAN 28", location: "JOSHUA TREE" },
            ].map((event, i) => (
              <div key={i}>
                <div className="bg-black text-white border-4 border-border shadow-brutal-2xl hover:shadow-[20px_20px_0px_0px_var(--color-border)] transition-all duration-300 p-6">
                  <h3 className="text-2xl font-bold text-white mb-4">{event.name}</h3>
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 mr-2 text-white" />
                    <span className="font-medium text-white">{event.date}</span>
                  </div>
                  <div className="flex items-center mb-6">
                    <MapPin className="h-5 w-5 mr-2 text-white" />
                    <span className="font-medium text-white">{event.location}</span>
                  </div>
                  <button className="bg-main text-main-foreground px-6 py-3 border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold w-full">
                    SIGN UP
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="bg-chart-5 border-4 border-border shadow-brutal-colored p-4 inline-block mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">TRAINING & ACTIVITIES</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "BOULDERING", desc: "Power moves on short routes" },
              { title: "SPORT CLIMBING", desc: "Clipped protection, pure movement" },
              { title: "TRAD CLIMBING", desc: "Place your own gear, old school" },
              { title: "OUTDOOR TRIPS", desc: "Real rock, real adventure" },
            ].map((activity, i) => (
              <div key={i}>
                <div className="bg-black text-white border-4 border-border shadow-brutal-xl p-6 hover:shadow-[16px_16px_0px_0px_var(--color-border)] transition-all duration-300">
                  <div className="bg-chart-1 border-2 border-border shadow-[8px_8px_0px_0px_var(--color-border)] p-4 mb-4">
                    <Image
                      src="/bouldering.png"
                      alt="Bouldering"
                      width={100}
                      height={100}
                      className="w-full h-20 object-cover border border-border"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{activity.title}</h3>
                  <p className="text-white font-medium">{activity.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stories Section */}
      <section className="py-20 bg-secondary-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="bg-chart-4 border-4 border-border shadow-brutal-colored-xl p-4 inline-block mb-12 transform -rotate-1">
              <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">STORIES FROM THE CRAG</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="relative bg-black border-4 border-border shadow-[24px_24px_0px_0px_var(--color-border)] overflow-hidden">
                <Image
                  src="/first-lead-story.png"
                  alt="First lead story"
                  width={500}
                  height={300}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-overlay flex items-end">
                  <div className="bg-chart-2 border-t-4 border-border p-6 w-full">
                    <h3 className="text-2xl font-bold text-main-foreground mb-2">FIRST LEAD AT RED ROCKS</h3>
                    <button className="text-main-foreground font-medium underline">READ MORE →</button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="relative bg-black border-4 border-border shadow-[24px_24px_0px_0px_var(--color-border)] overflow-hidden">
                <Image
                  src="/trust-story.png"
                  alt="Building trust story"
                  width={500}
                  height={300}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-overlay flex items-end">
                  <div className="bg-chart-3 border-t-4 border-border p-6 w-full">
                    <h3 className="text-2xl font-bold text-main-foreground mb-2">BUILDING TRUST ON THE WALL</h3>
                    <button className="text-main-foreground font-medium underline">READ MORE →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section id="join" className="py-20 bg-main">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div>
            <div className="bg-black text-white border-4 border-border shadow-[28px_28px_0px_0px_var(--color-border)] p-8 mb-8 transform rotate-1">
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">READY TO CLIMB WITH US?</h2>
              <p className="text-xl text-white font-medium mb-8">
                Join our community of passionate climbers. All levels welcome.
              </p>
              <button className="bg-chart-2 text-main-foreground px-12 py-6 border-4 border-border shadow-brutal-2xl hover:shadow-brutal-3xl transition-all font-bold text-2xl">
                JOIN NOW
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-background border-t-4 border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Mountain className="h-8 w-8 text-foreground" />
                  <span className="text-xl font-bold text-foreground">JAM ROCK CLIMBERS</span>
                </div>
                <p className="text-foreground font-medium mb-4">
                  123 Climbing St
                  <br />
                  Boulder, CO 80301
                </p>
                <p className="text-foreground font-medium">hello@jamrockclimbers.com</p>
              </div>
            </div>
            <div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">NAVIGATION</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#about" className="text-foreground hover:text-main font-medium">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#events" className="text-foreground hover:text-main font-medium">
                      Events
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="text-foreground hover:text-main font-medium">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="text-foreground hover:text-main font-medium">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">STAY CONNECTED</h3>
                <div className="flex space-x-4 mb-6">
                  <Instagram className="h-6 w-6 text-foreground hover:text-main cursor-pointer" />
                  <Facebook className="h-6 w-6 text-foreground hover:text-main cursor-pointer" />
                  <Twitter className="h-6 w-6 text-foreground hover:text-main cursor-pointer" />
                </div>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-4 py-2 border-2 border-border bg-background text-foreground font-medium"
                  />
                  <button className="bg-main text-main-foreground px-6 py-2 border-2 border-l-0 border-border shadow-[12px_12px_0px_0px_var(--color-border)] hover:shadow-[16px_16px_0px_0px_var(--color-border)] transition-all font-bold">
                    SUBSCRIBE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
