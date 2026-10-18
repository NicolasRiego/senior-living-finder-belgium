import { useI18n, type Locale } from "@/modules/i18n/I18nProvider";

type Section = { title: string; blocks: (string | string[] | { sub: string })[] };

const LAST_UPDATE: Record<Locale, string> = { fr: "18 octobre 2026", nl: "18 oktober 2026" };

const CONTENT: Record<Locale, { title: string; intro: string; updated: string; sections: Section[] }> = {
  fr: {
    title: "Politique de confidentialité",
    intro: "Cette page explique quelles données personnelles MyLivingHome collecte, pourquoi, avec qui elles sont partagées et comment exercer vos droits.",
    updated: "Dernière mise à jour",
    sections: [
      {
        title: "1. Qui est responsable de vos données",
        blocks: [
          "Le site MyLivingHome (mylivinghome.be) est exploité par [à compléter], numéro d'entreprise [à compléter], dont le siège est situé [à compléter]. C'est le responsable du traitement de vos données personnelles.",
          "Pour toute question sur vos données, écrivez-nous à info@mylivinghome.be.",
        ],
      },
      {
        title: "2. Quelles données nous collectons, et pourquoi",
        blocks: [
          { sub: "Quand vous créez un compte" },
          "Nous enregistrons votre adresse e-mail, votre mot de passe (chiffré, nous ne pouvons pas le lire) et votre nom. Ils servent à vous connecter et à retrouver vos résidences enregistrées et vos comparaisons. Base légale : l'exécution du service que vous demandez en créant un compte.",
          { sub: "Quand vous contactez une résidence" },
          "Quand vous envoyez une demande à une résidence (visite, brochure, rappel ou information), nous enregistrons :",
          [
            "votre prénom, votre nom, votre e-mail et, si vous le donnez, votre téléphone ;",
            "votre message et, pour une visite, la date et l'heure souhaitées ;",
            "si vous les indiquez : pour qui vous cherchez, la région, le budget, l'échéance et le niveau d'autonomie de la personne.",
          ],
          "Ces informations sont transmises à la résidence que vous avez choisie, et à elle seule, pour qu'elle puisse vous répondre.",
          "Le niveau d'autonomie est une information sur la santé. Il est toujours facultatif : vous pouvez envoyer votre demande sans le donner. Si vous le donnez, il n'est transmis qu'à la résidence concernée, avec votre consentement explicite.",
          "Base légale : votre consentement, donné en cochant la case du formulaire. Vous pouvez le retirer à tout moment en nous écrivant.",
          { sub: "Quand vous nous écrivez via la page Contact" },
          "Nous enregistrons votre nom, votre e-mail, votre téléphone si vous le donnez, et votre message. Ils sont envoyés à notre boîte info@mylivinghome.be et servent uniquement à vous répondre. Ces messages ne sont pas transmis aux résidences. Base légale : notre intérêt légitime à répondre aux questions qu'on nous pose.",
          { sub: "Quand vous consultez les fiches des résidences" },
          "Nous comptons les consultations de chaque fiche et les clics sur le téléphone, l'e-mail ou le site d'une résidence. Nous utilisons pour cela un identifiant de visite aléatoire, effacé quand vous fermez votre navigateur, et votre identifiant de compte si vous êtes connecté. Aucun outil de mesure d'audience tiers n'est utilisé. Ces chiffres permettent aux résidences de savoir combien de personnes s'intéressent à elles. Base légale : notre intérêt légitime à mesurer l'utilisation du site.",
          { sub: "Si vous gérez une résidence" },
          "Nous enregistrons les informations de votre compte (nom, e-mail), celles de votre résidence et celles des membres de votre équipe que vous invitez. Base légale : l'exécution de notre accord de partenariat.",
        ],
      },
      {
        title: "3. Ce qui est enregistré dans votre navigateur",
        blocks: [
          "Le site garde quelques informations dans votre navigateur, sans publicité ni suivi par des tiers :",
          [
            "votre langue et la taille de texte choisie ;",
            "les résidences et logements ajoutés au comparateur ;",
            "votre connexion, si vous avez un compte ;",
            "l'heure de votre dernière demande, pour éviter les envois répétés ;",
            "l'identifiant de visite utilisé pour les statistiques, effacé à la fermeture du navigateur.",
          ],
        ],
      },
      {
        title: "4. Qui reçoit vos données",
        blocks: [
          [
            "La résidence que vous contactez, et elle seule, pour les demandes que vous lui adressez.",
            "Nos prestataires techniques, qui agissent pour notre compte : Supabase (base de données) et Lovable (hébergement du site et envoi des e-mails).",
          ],
          "Nous ne vendons jamais vos données.",
        ],
      },
      {
        title: "5. Combien de temps nous les gardons",
        blocks: [
          [
            "Votre compte : jusqu'à ce que vous le supprimiez.",
            "Vos demandes aux résidences : 24 mois maximum.",
            "Vos messages via la page Contact : 24 mois maximum.",
            "Les statistiques de consultation : 24 mois maximum.",
          ],
        ],
      },
      {
        title: "6. Vos droits",
        blocks: [
          "Vous pouvez à tout moment :",
          [
            "accéder à vos données et en recevoir une copie ; si vous avez un compte, vous pouvez les télécharger vous-même dans Mon espace, rubrique « Mes données » ;",
            "les faire corriger ;",
            "les faire effacer, notamment en supprimant votre compte dans Mon espace ;",
            "retirer votre consentement ;",
            "vous opposer à un traitement ou en demander la limitation.",
          ],
          "Pour exercer ces droits, écrivez à info@mylivinghome.be. Nous répondons dans un délai d'un mois.",
          "Si vous estimez que vos données ne sont pas traitées correctement, vous pouvez porter plainte auprès de l'Autorité de protection des données (www.autoriteprotectiondonnees.be).",
        ],
      },
      {
        title: "7. Sécurité",
        blocks: [
          "Vos données sont transmises de façon chiffrée. L'accès aux demandes et aux messages est réservé à la résidence concernée et à l'équipe MyLivingHome.",
        ],
      },
      {
        title: "8. Modifications",
        blocks: [
          "Nous pouvons mettre cette politique à jour. La date de la dernière version est indiquée en bas de cette page.",
        ],
      },
    ],
  },
  nl: {
    title: "Privacybeleid",
    intro: "Op deze pagina leest u welke persoonsgegevens MyLivingHome verzamelt, waarom, met wie ze gedeeld worden en hoe u uw rechten uitoefent.",
    updated: "Laatst bijgewerkt",
    sections: [
      {
        title: "1. Wie is verantwoordelijk voor uw gegevens",
        blocks: [
          "De website MyLivingHome (mylivinghome.be) wordt uitgebaat door [in te vullen], ondernemingsnummer [in te vullen], met maatschappelijke zetel te [in te vullen]. Zij is de verwerkingsverantwoordelijke voor uw persoonsgegevens.",
          "Voor elke vraag over uw gegevens kunt u ons schrijven op info@mylivinghome.be.",
        ],
      },
      {
        title: "2. Welke gegevens we verzamelen, en waarom",
        blocks: [
          { sub: "Wanneer u een account aanmaakt" },
          "We bewaren uw e-mailadres, uw wachtwoord (versleuteld, wij kunnen het niet lezen) en uw naam. Ze dienen om u aan te melden en uw opgeslagen residenties en vergelijkingen terug te vinden. Rechtsgrond: de uitvoering van de dienst die u vraagt door een account aan te maken.",
          { sub: "Wanneer u een residentie contacteert" },
          "Wanneer u een aanvraag stuurt naar een residentie (bezoek, brochure, terugbelverzoek of informatie), bewaren we:",
          [
            "uw voornaam, naam, e-mailadres en, als u het opgeeft, uw telefoonnummer;",
            "uw bericht en, voor een bezoek, de gewenste datum en het gewenste uur;",
            "als u ze opgeeft: voor wie u zoekt, de regio, het budget, de termijn en de graad van zelfstandigheid van de persoon.",
          ],
          "Deze gegevens worden alleen doorgegeven aan de residentie die u gekozen hebt, zodat ze u kan antwoorden.",
          "De graad van zelfstandigheid is een gegeven over de gezondheid. Het is altijd facultatief: u kunt uw aanvraag versturen zonder het op te geven. Als u het opgeeft, wordt het alleen aan de betrokken residentie doorgegeven, met uw uitdrukkelijke toestemming.",
          "Rechtsgrond: uw toestemming, gegeven door het vakje in het formulier aan te vinken. U kunt ze op elk moment intrekken door ons te schrijven.",
          { sub: "Wanneer u ons schrijft via de contactpagina" },
          "We bewaren uw naam, uw e-mailadres, uw telefoonnummer als u het opgeeft, en uw bericht. Ze worden naar onze mailbox info@mylivinghome.be gestuurd en dienen alleen om u te antwoorden. Deze berichten worden niet aan residenties doorgegeven. Rechtsgrond: ons gerechtvaardigd belang om de vragen die ons gesteld worden te beantwoorden.",
          { sub: "Wanneer u de fiches van residenties bekijkt" },
          "We tellen hoe vaak elke fiche bekeken wordt en de klikken op het telefoonnummer, het e-mailadres of de website van een residentie. Daarvoor gebruiken we een willekeurige bezoekcode, die gewist wordt wanneer u uw browser sluit, en uw accountcode als u aangemeld bent. Er wordt geen meetinstrument van derden gebruikt. Met deze cijfers weten residenties hoeveel mensen interesse in hen hebben. Rechtsgrond: ons gerechtvaardigd belang om het gebruik van de website te meten.",
          { sub: "Als u een residentie beheert" },
          "We bewaren de gegevens van uw account (naam, e-mailadres), die van uw residentie en die van de teamleden die u uitnodigt. Rechtsgrond: de uitvoering van onze partnerovereenkomst.",
        ],
      },
      {
        title: "3. Wat in uw browser bewaard wordt",
        blocks: [
          "De website bewaart enkele gegevens in uw browser, zonder reclame of tracking door derden:",
          [
            "uw taal en de gekozen tekstgrootte;",
            "de residenties en woningen die u aan de vergelijker hebt toegevoegd;",
            "uw aanmelding, als u een account hebt;",
            "het tijdstip van uw laatste aanvraag, om herhaalde verzendingen te vermijden;",
            "de bezoekcode voor de statistieken, die gewist wordt wanneer u uw browser sluit.",
          ],
        ],
      },
      {
        title: "4. Wie uw gegevens ontvangt",
        blocks: [
          [
            "De residentie die u contacteert, en alleen zij, voor de aanvragen die u haar stuurt.",
            "Onze technische dienstverleners, die in onze opdracht handelen: Supabase (database) en Lovable (hosting van de website en verzending van e-mails).",
          ],
          "We verkopen uw gegevens nooit.",
        ],
      },
      {
        title: "5. Hoe lang we ze bewaren",
        blocks: [
          [
            "Uw account: tot u het verwijdert.",
            "Uw aanvragen aan residenties: maximaal 24 maanden.",
            "Uw berichten via de contactpagina: maximaal 24 maanden.",
            "De bezoekstatistieken: maximaal 24 maanden.",
          ],
        ],
      },
      {
        title: "6. Uw rechten",
        blocks: [
          "U kunt op elk moment:",
          [
            "uw gegevens inzien en er een kopie van krijgen; als u een account hebt, kunt u ze zelf downloaden in Mijn ruimte, rubriek « Mijn gegevens »;",
            "ze laten verbeteren;",
            "ze laten wissen, onder meer door uw account te verwijderen in Mijn ruimte;",
            "uw toestemming intrekken;",
            "bezwaar maken tegen een verwerking of de beperking ervan vragen.",
          ],
          "Om deze rechten uit te oefenen, schrijft u naar info@mylivinghome.be. We antwoorden binnen een maand.",
          "Als u vindt dat uw gegevens niet correct verwerkt worden, kunt u een klacht indienen bij de Gegevensbeschermingsautoriteit (www.gegevensbeschermingsautoriteit.be).",
        ],
      },
      {
        title: "7. Beveiliging",
        blocks: [
          "Uw gegevens worden versleuteld verzonden. Alleen de betrokken residentie en het MyLivingHome-team hebben toegang tot de aanvragen en berichten.",
        ],
      },
      {
        title: "8. Wijzigingen",
        blocks: [
          "We kunnen dit beleid bijwerken. De datum van de laatste versie staat onderaan deze pagina.",
        ],
      },
    ],
  },
};

export default function PrivacyPage() {
  const { locale } = useI18n();
  const c = CONTENT[locale];
  return (
    <div className="container py-12 lg:py-20">
      <article className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold md:text-4xl text-balance">{c.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{c.intro}</p>
        {c.sections.map((s) => (
          <section key={s.title} className="mt-10">
            <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
            {s.blocks.map((b, i) =>
              typeof b === "string" ? (
                <p key={i} className="mt-3 text-base leading-relaxed">{b}</p>
              ) : Array.isArray(b) ? (
                <ul key={i} className="mt-3 list-disc space-y-1 pl-6 text-base leading-relaxed">
                  {b.map((li) => <li key={li}>{li}</li>)}
                </ul>
              ) : (
                <h3 key={i} className="mt-6 text-lg font-semibold">{b.sub}</h3>
              ),
            )}
          </section>
        ))}
        <p className="mt-12 text-sm text-muted-foreground">
          {c.updated} : {LAST_UPDATE[locale]} · <a href="mailto:info@mylivinghome.be" className="underline hover:text-foreground">info@mylivinghome.be</a>
        </p>
      </article>
    </div>
  );
}
