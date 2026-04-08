import { motion } from "framer-motion";
import { ShieldCheck, RotateCcw, Truck, FileText, Phone, MapPin, Clock3 } from "lucide-react";

const policySections = [
  {
    id: "privacy",
    title: "Privacy Policy",
    icon: ShieldCheck,
    description:
      "We collect only the information needed to process orders, provide delivery updates, and support customer service.",
    points: [
      "Customer name, phone number, delivery address, and order details are used only for order fulfillment and account support.",
      "Payment details are handled through approved payment partners. We do not store full card or wallet credentials on our website.",
      "Customer information is never sold to third parties. Limited data may be shared with courier partners only to complete delivery.",
      "You may contact us to update or remove your stored information where legally permitted.",
    ],
  },
  {
    id: "returns",
    title: "Return & Refund Policy",
    icon: RotateCcw,
    description:
      "We want every order to arrive in excellent condition. If there is an issue, our support team will help review it quickly.",
    points: [
      "Return or replacement requests should be reported within 3 days of delivery.",
      "Products must be unused, sealed, and in original packaging unless they arrived damaged or incorrect.",
      "Refunds are issued only for approved cases such as damaged, defective, or wrongly delivered items.",
      "Approved refunds are processed back to the original payment method or bank account within 7 to 10 business days.",
    ],
  },
  {
    id: "shipping",
    title: "Shipping & Service Policy",
    icon: Truck,
    description:
      "We deliver tissue and hygiene products across Pakistan through courier and local dispatch partners.",
    points: [
      "Orders are usually confirmed within business hours from Monday to Saturday, 9:00 AM to 6:00 PM.",
      "Standard delivery time is 2 to 5 business days for major cities and 3 to 7 business days for other locations.",
      "Shipping charges, if applicable, are shown at checkout before order confirmation.",
      "Delivery delays caused by weather, strikes, remote-location routing, or public holidays may extend the timeline.",
    ],
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    icon: FileText,
    description:
      "By using this website, customers agree to follow our ordering, payment, delivery, and support terms.",
    points: [
      "All prices, availability, and promotional offers may change without prior notice.",
      "Orders may be cancelled if stock is unavailable, payment is incomplete, or delivery information is incorrect.",
      "Customers are responsible for providing accurate contact and shipping details during checkout.",
      "Casper reserves the right to update these terms and policies at any time by publishing the revised version on this website.",
    ],
  },
];

const contactCards = [
  {
    title: "Customer Support",
    icon: Phone,
    value: "03128513901",
    detail: "caspertissue@gmail.com",
  },
  {
    title: "Local Office Address",
    icon: MapPin,
    value: "Gulshan-e-Iqbal Block 3, Karachi, Pakistan",
    detail: "Visits by appointment",
  },
  {
    title: "Service Hours",
    icon: Clock3,
    value: "Monday to Saturday",
    detail: "Order support and dispatch updates during business hours",
  },
];

export default function Policies() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-20"
    >
      <section className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-7xl mx-auto rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-6 py-10 shadow-sm md:px-10 md:py-14">
          <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            Store Policies & Business Information
          </span>
          <h1 className="mt-5 text-4xl font-display font-bold tracking-tight text-foreground md:text-5xl">
            Everything customers need before placing an order.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
            This page outlines our privacy practices, return and refund process, shipping service details,
            website terms, and official contact information for Casper in Pakistan.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-7xl mx-auto grid gap-4 md:grid-cols-3">
          {contactCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <card.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-foreground">{card.value}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-7xl mx-auto grid gap-6">
          {policySections.map((section, index) => (
            <motion.article
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-8"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <section.icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-foreground">{section.title}</h2>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">{section.description}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                {section.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 text-sm leading-6 text-muted-foreground"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
