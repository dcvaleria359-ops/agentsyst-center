import type { NormalizedInput, SocialAnalysis, SocialChannelAnalysis, Evidence } from '../types'
import { THRESHOLDS } from '../config'

const BIO_CTA_KEYWORDS = ['reserva', 'cita', 'contacta', 'llama', 'escríbenos', 'pide', 'book', 'whatsapp', 'link en bio']
const BIO_CONTACT_KEYWORDS = ['tel', 'email', '@', 'www.', 'http', '📞', '📧']

function hasBioCta(bio: string | null): boolean {
  if (!bio) return false
  const lower = bio.toLowerCase()
  return BIO_CTA_KEYWORDS.some(k => lower.includes(k))
}

function hasBioContact(bio: string | null): boolean {
  if (!bio) return false
  const lower = bio.toLowerCase()
  return BIO_CONTACT_KEYWORDS.some(k => lower.includes(k))
}

function channelStatus(postsPerWeek: number, daysSince: number | null): SocialChannelAnalysis['status'] {
  if (daysSince !== null && daysSince > THRESHOLDS.DAYS_DORMANT) return 'dormant'
  if (postsPerWeek < THRESHOLDS.POSTS_PER_WEEK_DORMANT) return 'dormant'
  return 'active'
}

function absentChannel(platform: string): SocialChannelAnalysis {
  return {
    platform,
    status: 'absent',
    followers: null,
    posts_count: null,
    posts_per_week: null,
    engagement_ratio: null,
    days_since_last_post: null,
    bio_has_cta: null,
    bio_has_contact: null,
    alerts: [`Canal ${platform} no detectado`],
    evidence: [{ field: `social_profiles.${platform}`, value: null }],
  }
}

export function analyzeSocial(input: NormalizedInput): SocialAnalysis {
  const channels: SocialChannelAnalysis[] = []

  // Instagram
  if (input.instagram) {
    const ig = input.instagram
    const status = channelStatus(ig.posts_per_week, ig.days_since_last_post)
    const alerts: string[] = []
    const evidence: Evidence[] = [
      { field: 'instagram.followers', value: ig.followers },
      { field: 'instagram.posts_per_week', value: ig.posts_per_week },
      { field: 'instagram.engagement_ratio', value: ig.engagement_ratio },
      { field: 'instagram.days_since_last_post', value: ig.days_since_last_post },
    ]

    if (status === 'dormant') {
      const months = ig.days_since_last_post ? Math.round(ig.days_since_last_post / 30) : '?'
      alerts.push(`Instagram dormido — sin publicar hace ~${months} meses`)
    }
    if (ig.followers < THRESHOLDS.FOLLOWERS_SMALL) {
      alerts.push(`Audiencia muy pequeña (${ig.followers} seguidores)`)
    }
    if (!hasBioCta(ig.bio)) alerts.push('Bio de Instagram sin llamada a la acción')

    channels.push({
      platform: 'instagram',
      status,
      followers: ig.followers,
      posts_count: ig.posts_count,
      posts_per_week: ig.posts_per_week,
      engagement_ratio: ig.engagement_ratio,
      days_since_last_post: ig.days_since_last_post,
      bio_has_cta: hasBioCta(ig.bio),
      bio_has_contact: hasBioContact(ig.bio),
      alerts,
      evidence,
    })
  } else {
    channels.push(absentChannel('instagram'))
  }

  channels.push(absentChannel('facebook'))
  channels.push(absentChannel('tiktok'))

  const activeChannels = channels.filter(c => c.status === 'active')
  const dormantChannels = channels.filter(c => c.status === 'dormant')

  let overallStatus: SocialAnalysis['overall_status'] = 'absent'
  if (activeChannels.length > 0) overallStatus = 'active'
  else if (dormantChannels.length > 0) overallStatus = 'weak'

  const mostActive = activeChannels[0]?.platform ?? dormantChannels[0]?.platform ?? null
  const mostNeglected = channels.find(c => c.status === 'absent')?.platform ?? null

  return {
    channels,
    most_active_channel: mostActive,
    most_neglected_channel: mostNeglected,
    overall_status: overallStatus,
    evidence: [{
      field: 'social_profiles',
      value: overallStatus,
      note: `Estado general de presencia social: ${overallStatus}`,
    }],
  }
}
