import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  ticketTitle?: string
  authorEmail?: string
  excerpt?: string
  ticketUrl?: string
}

const Email = ({ ticketTitle, authorEmail, excerpt, ticketUrl }: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Nouvelle réponse sur le ticket {ticketTitle || ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{ticketTitle || 'Ticket'}</Heading>
        <Text style={text}><strong>{authorEmail || "Quelqu'un"}</strong> a répondu :</Text>
        <Section style={quote}><Text style={quoteText}>{excerpt || ''}</Text></Section>
        {ticketUrl ? <Button style={button} href={ticketUrl}>Voir le ticket</Button> : null}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Nouvelle réponse sur le ticket : ${d.ticketTitle ?? ''}`,
  displayName: 'Commentaire sur un ticket',
  previewData: { ticketTitle: '#11 Choix de la couleur de base', authorEmail: 'admin@mylivinghome.be', excerpt: 'Je propose le vert foncé.', ticketUrl: 'https://mylivinghome.be/admin/tickets/1' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '20px', color: '#1a3d2b', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#555', margin: '4px 0' }
const quote = { borderLeft: '3px solid #ddd', margin: '16px 0', padding: '4px 12px' }
const quoteText = { fontSize: '15px', color: '#333', whiteSpace: 'pre-wrap' as const }
const button = { backgroundColor: '#1a3d2b', color: '#ffffff', padding: '10px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '15px' }
