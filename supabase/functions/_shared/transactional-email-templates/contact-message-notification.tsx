import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string
  phone?: string
  message?: string
}

const Email = ({ name, email, phone, message }: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Nouveau message de {name || 'un visiteur'} sur MyLivingHome</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nouveau message depuis la page Contact</Heading>
        <Text style={text}><strong>Nom :</strong> {name || '—'}</Text>
        <Text style={text}><strong>E-mail :</strong> {email || '—'}</Text>
        <Text style={text}><strong>Téléphone :</strong> {phone || '—'}</Text>
        <Section style={quote}><Text style={quoteText}>{message || ''}</Text></Section>
        {email ? (
          <Button style={button} href={`mailto:${email}?subject=${encodeURIComponent('Votre message à MyLivingHome')}`}>
            Répondre à {name || email}
          </Button>
        ) : null}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Nouveau message de contact : ${d.name ?? 'visiteur'}`,
  displayName: 'Message de contact (admin)',
  to: 'info@mylivinghome.be',
  previewData: { name: 'Marie Dupont', email: 'marie@example.com', phone: '0470 12 34 56', message: 'Bonjour, je cherche une résidence à Namur.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '20px', color: '#1a3d2b', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#333', margin: '4px 0' }
const quote = { borderLeft: '3px solid #ddd', margin: '16px 0', padding: '4px 12px' }
const quoteText = { fontSize: '15px', color: '#333', whiteSpace: 'pre-wrap' as const }
const button = { backgroundColor: '#2f5d4a', color: '#ffffff', padding: '10px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '15px' }
