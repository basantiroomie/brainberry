import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react"

interface SocialIconsProps {
  type: "instagram" | "facebook" | "twitter" | "linkedin"
  href?: string
}

export default function SocialIcons({ type, href }: SocialIconsProps) {
  const IconComponent = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
  }[type]

  const icon = (
    <IconComponent className="h-4 w-4 text-foreground hover:text-main cursor-pointer transition-colors touch-manipulation" />
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="touch-manipulation">
        {icon}
      </a>
    )
  }

  return icon
}