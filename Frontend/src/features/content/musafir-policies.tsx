import type { ReactNode } from "react";

import { SUPPORT_EMAIL } from "@/constants/site";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="legal-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function ReturnRefundPolicyCopy() {
  return (
    <>
      <p>
        At <strong>MUSAFIR</strong>, we want customers to be satisfied with their purchase. This Return &amp;
        Refund Policy explains the conditions under which products purchased through <strong>musafir.com</strong> may be
        returned.
      </p>
      <Section title="1. 30-Day Return Period">
        <p>
          Eligible products may be returned within <strong>30 days of the date you receive your order</strong>.
        </p>
        <p>
          To qualify for a return, you must contact MUSAFIR within this 30-day period and follow the return
          instructions provided by our customer service team.
        </p>
        <p>Return requests submitted after the 30-day return period may be declined.</p>
      </Section>
      <Section title="2. Return Eligibility">
        <p>To be eligible for a return, the product must generally:</p>
        <ul>
          <li>Be unused and unworn;</li>
          <li>Be clean and in resalable condition;</li>
          <li>Be free from damage caused after delivery;</li>
          <li>Include original packaging where reasonably available;</li>
          <li>Include original tags, accessories, components, and documentation; and</li>
          <li>Include proof of purchase or a valid MUSAFIR order number.</li>
        </ul>
        <p>
          Products showing significant signs of use, wear, contamination, alteration, misuse, or customer-caused damage
          may not qualify for a refund.
        </p>
      </Section>
      <Section title="3. Return Shipping Costs">
        <p>For standard returns, including situations where the customer:</p>
        <ul>
          <li>Changes their mind;</li>
          <li>Orders the incorrect size;</li>
          <li>Orders the wrong product;</li>
          <li>No longer wants the product; or</li>
          <li>Wishes to exchange an otherwise correctly supplied item,</li>
        </ul>
        <p>
          <strong>the customer is responsible for all return shipping expenses.</strong>
        </p>
        <p>
          MUSAFIR does not reimburse return courier charges, postage, insurance fees, customs charges,
          import/export charges, brokerage fees, or other return-related expenses unless the return results from an
          error attributable to MUSAFIR or applicable law requires otherwise.
        </p>
        <p>
          We strongly recommend using a <strong>tracked and insured shipping service</strong> when returning an item.
        </p>
        <p>MUSAFIR is not responsible for returned packages that are lost or damaged while being shipped back to us.</p>
      </Section>
      <Section title="4. Original Shipping Charges">
        <p>Original shipping or delivery charges are generally non-refundable unless:</p>
        <ul>
          <li>The wrong item was sent;</li>
          <li>The product was verified as defective;</li>
          <li>The product arrived materially damaged; or</li>
          <li>A refund of shipping charges is required by applicable law.</li>
        </ul>
      </Section>
      <Section title="5. How to Request a Return">
        <p>
          Before sending any product back, please contact MUSAFIR through the customer support details available
          on <strong>musafir.com</strong>.
        </p>
        <p>Please provide:</p>
        <ul>
          <li>Your full name;</li>
          <li>Order number;</li>
          <li>Product you wish to return;</li>
          <li>Reason for the return; and</li>
          <li>Photographs where the item is damaged, defective, or incorrect.</li>
        </ul>
        <p>Our customer service team will provide return instructions where the item is eligible.</p>
        <p>
          <strong>Do not return a product without first contacting us</strong>, as unauthorized returns may experience
          processing delays or may be rejected.
        </p>
      </Section>
      <Section title="6. Return Packaging">
        <p>Customers are responsible for packaging returned products securely.</p>
        <p>Products should be appropriately protected to prevent damage during transportation.</p>
        <p>
          MUSAFIR may reduce or decline a refund where an item is returned damaged due to insufficient packaging
          or customer mishandling, subject to applicable law.
        </p>
      </Section>
      <Section title="7. Inspection of Returned Products">
        <p>All returned products are inspected after they are received.</p>
        <p>We will verify whether the item complies with the return conditions outlined in this policy.</p>
        <p>Inspection may include reviewing:</p>
        <ul>
          <li>Product condition;</li>
          <li>Signs of use or wear;</li>
          <li>Damage;</li>
          <li>Missing parts;</li>
          <li>Original accessories;</li>
          <li>Packaging;</li>
          <li>Tags; and</li>
          <li>Product authenticity.</li>
        </ul>
      </Section>
      <Section title="8. Refund Processing">
        <p>
          If your return is approved after inspection, the applicable refund will generally be issued to the original
          payment method.
        </p>
        <p>
          Depending on your bank, card issuer, or payment provider, it may take additional time for the refunded amount
          to appear in your account.
        </p>
        <p>
          MUSAFIR has no control over processing times imposed by banks or payment providers after a refund has
          been issued.
        </p>
      </Section>
      <Section title="9. Refund Deductions">
        <p>Where permitted by law, deductions may be made if a returned item:</p>
        <ul>
          <li>Has been used beyond what is reasonably necessary to inspect it;</li>
          <li>Has been damaged by the customer;</li>
          <li>Is missing accessories or components;</li>
          <li>Is returned in materially reduced condition; or</li>
          <li>Requires restoration due to customer handling.</li>
        </ul>
        <p>Any deduction will be assessed according to the circumstances and applicable consumer law.</p>
      </Section>
      <Section title="10. Exchanges">
        <p>Where available, eligible products may be exchanged for another size, variation, or product.</p>
        <p>Customers requesting an exchange are generally responsible for:</p>
        <ul>
          <li>The cost of returning the original product; and</li>
          <li>Shipping costs associated with sending the replacement item,</li>
        </ul>
        <p>
          unless the exchange is required because MUSAFIR supplied a defective, damaged, or incorrect product.
        </p>
        <p>Any price difference between the original item and replacement item must also be paid where applicable.</p>
      </Section>
      <Section title="11. Non-Returnable Products">
        <p>
          The following products may not be eligible for return unless they are defective, damaged upon arrival,
          incorrectly supplied, or applicable law requires otherwise:
        </p>
        <ul>
          <li>Customized products;</li>
          <li>Personalized products;</li>
          <li>Engraved or monogrammed products;</li>
          <li>Custom-sized products;</li>
          <li>Made-to-order products;</li>
          <li>Products altered at the customer&apos;s request;</li>
          <li>Used products;</li>
          <li>Products damaged through misuse;</li>
          <li>Products with significant signs of wear;</li>
          <li>Items returned after the 30-day return period; and</li>
          <li>Certain clearance or final-sale products where clearly marked as non-returnable.</li>
        </ul>
      </Section>
      <Section title="12. Customized and Made-to-Order Products">
        <p>
          Because customized, personalized, and made-to-order products are manufactured or altered according to customer
          specifications, they are generally <strong>non-refundable and non-returnable</strong>.
        </p>
        <p>Customers are responsible for ensuring that all submitted:</p>
        <ul>
          <li>Measurements;</li>
          <li>Sizes;</li>
          <li>Colors;</li>
          <li>Names;</li>
          <li>Initials;</li>
          <li>Personalization details; and</li>
          <li>Other specifications</li>
        </ul>
        <p>are correct before production begins.</p>
        <p>
          This restriction does not apply where a custom item is defective, materially damaged upon delivery, or does
          not match the specifications accepted by MUSAFIR.
        </p>
      </Section>
      <Section title="13. Damaged Products">
        <p>If your order arrives damaged, please contact MUSAFIR as soon as reasonably possible after delivery.</p>
        <p>You may be asked to provide:</p>
        <ul>
          <li>Photographs of the product;</li>
          <li>Photographs of the packaging;</li>
          <li>Shipping label photographs;</li>
          <li>Video evidence where appropriate; and</li>
          <li>Your order number.</li>
        </ul>
        <p>Please retain the original packaging until the matter has been reviewed.</p>
        <p>
          Where the damage is verified, MUSAFIR may provide an appropriate remedy, including replacement, repair,
          refund, or another suitable solution.
        </p>
      </Section>
      <Section title="14. Defective Products">
        <p>
          If you believe a product has a manufacturing defect, contact us with your order number and clear details of
          the issue.
        </p>
        <p>
          Normal wear and tear, accidental damage, improper care, incorrect installation, improper fitting, misuse,
          neglect, unauthorized modification, or damage resulting from use outside the product&apos;s intended purpose
          will generally not be considered manufacturing defects.
        </p>
      </Section>
      <Section title="15. Incorrect Products">
        <p>
          If MUSAFIR sends you a product different from the item confirmed in your order, please contact us
          promptly.
        </p>
        <p>After verification, we will provide instructions for resolving the issue.</p>
        <p>
          Where MUSAFIR is responsible for sending the incorrect product, reasonable return shipping expenses may
          be covered by MUSAFIR in accordance with the return instructions provided.
        </p>
      </Section>
      <Section title="16. Size and Fit">
        <p>
          Customers are responsible for reviewing available measurements, sizing information, and product specifications
          before placing an order.
        </p>
        <p>
          If the correct item was supplied but does not fit because the wrong size was selected, it may still qualify
          for return within the 30-day period if all other return conditions are satisfied.
        </p>
        <p>
          In such circumstances, <strong>the customer is responsible for return shipping and any replacement shipping
          costs</strong>.
        </p>
      </Section>
      <Section title="17. Refused and Unclaimed Deliveries">
        <p>
          If a customer refuses delivery or fails to collect a shipment without prior authorization, any costs incurred
          for:
        </p>
        <ul>
          <li>Return shipping;</li>
          <li>Customs;</li>
          <li>Duties;</li>
          <li>Courier handling;</li>
          <li>Storage; or</li>
          <li>Redelivery</li>
        </ul>
        <p>may be deducted from any available refund where permitted by law.</p>
      </Section>
      <Section title="18. International Returns">
        <p>
          Customers returning products internationally are responsible for correctly declaring the shipment as a{" "}
          <strong>returned product</strong>, where permitted, and complying with applicable customs requirements.
        </p>
        <p>
          MUSAFIR is not responsible for additional customs duties, taxes, brokerage fees, or charges caused by
          incorrect return documentation.
        </p>
        <p>International customers are responsible for return shipping costs unless MUSAFIR confirms otherwise.</p>
      </Section>
      <Section title="19. Lost Return Shipments">
        <p>
          The customer remains responsible for the returned product until it is successfully delivered to the designated
          return address.
        </p>
        <p>For this reason, we recommend:</p>
        <ul>
          <li>Tracking;</li>
          <li>Delivery confirmation; and</li>
          <li>Shipping insurance where appropriate.</li>
        </ul>
        <p>Refunds cannot normally be processed for returned products that never reach us.</p>
      </Section>
      <Section title="20. Promotional and Sale Items">
        <p>
          Unless specifically marked as <strong>Final Sale</strong>, eligible promotional or sale products may be
          returned under the same 30-day return conditions.
        </p>
        <p>
          Items clearly identified as Final Sale may not be returned for change-of-mind reasons, subject to applicable
          consumer protection laws.
        </p>
      </Section>
      <Section title="21. Refund Method">
        <p>Approved refunds will generally be issued using the original payment method.</p>
        <p>
          If the original payment method cannot reasonably be used, MUSAFIR may arrange another appropriate refund
          method.
        </p>
      </Section>
      <Section title="22. Consumer Rights">
        <p>
          This Return &amp; Refund Policy does not limit any mandatory legal rights available to customers under
          applicable consumer protection laws.
        </p>
        <p>
          Where applicable law provides customers with additional cancellation, refund, replacement, or warranty rights,
          those mandatory rights will continue to apply.
        </p>
      </Section>
      <Section title="23. Contact Us">
        <p>
          To request a return or ask a question regarding a refund, exchange, damaged item, defective product, or
          incorrect shipment, please email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="info-page-link">
            {SUPPORT_EMAIL}
          </a>{" "}
          or use the customer service information provided on <strong>musafir.com</strong>.
        </p>
        <p>
          Please include your <strong>order number</strong> in your message so that your request can be reviewed
          efficiently.
        </p>
      </Section>
    </>
  );
}

export function TermsAndConditionsCopy() {
  return (
    <>
      <p>
        Welcome to <strong>MUSAFIR</strong>. These Terms &amp; Conditions govern your access to and use of our
        website, <strong>musafir.com</strong>, and any purchases made through our online store.
      </p>
      <p>
        By accessing our website, placing an order, or using any of our services, you agree to be bound by these Terms
        &amp; Conditions. Please read them carefully before making a purchase.
      </p>
      <Section title="1. General">
        <p>
          MUSAFIR operates an online store offering contemporary Pakistani menswear, including coats and blazers,
          formal shirts, trousers, footwear, matching sets, and related apparel.
        </p>
        <p>
          We reserve the right to update, modify, suspend, or discontinue any part of the website, products, pricing,
          policies, or services at any time without prior notice.
        </p>
        <p>
          Your continued use of the website following any changes constitutes acceptance of the updated Terms &amp;
          Conditions.
        </p>
      </Section>
      <Section title="2. Eligibility">
        <p>By using this website and placing an order, you confirm that:</p>
        <ul>
          <li>You are legally capable of entering into a binding agreement.</li>
          <li>The information you provide is accurate, complete, and current.</li>
          <li>You are authorized to use the payment method provided for your purchase.</li>
        </ul>
        <p>
          If you are purchasing on behalf of a business or organization, you confirm that you have authority to bind
          that organization to these Terms &amp; Conditions.
        </p>
      </Section>
      <Section title="3. Product Information">
        <p>
          We make every reasonable effort to ensure that product descriptions, specifications, measurements, materials,
          colors, photographs, and other information displayed on our website are accurate.
        </p>
        <p>
          However, because fabrics, dyes, and garment finishes can vary slightly between production runs, small
          differences may appear in:
        </p>
        <ul>
          <li>Colour</li>
          <li>Texture</li>
          <li>Weave or knit</li>
          <li>Stitching</li>
          <li>Finish</li>
          <li>Fit and measurements</li>
          <li>Button or hardware appearance</li>
        </ul>
        <p>may occur and are not necessarily considered defects.</p>
        <p>Colours may also appear differently depending on your device, display settings, lighting, and photography.</p>
      </Section>
      <Section title="4. Made-to-Order and Limited Runs">
        <p>Certain MUSAFIR products may be produced in limited quantities or finished in small batches.</p>
        <p>
          Small variations between individual garments are a normal characteristic of apparel production and do not
          affect the quality of the product when within reasonable commercial tolerances.
        </p>
        <p>
          Such reasonable variations are not considered manufacturing defects unless they materially affect the fit,
          wearability, or intended use of the garment.
        </p>
      </Section>
      <Section title="5. Product Availability">
        <p>All products are subject to availability.</p>
        <p>
          Adding an item to your cart does not guarantee that the product will remain available until your order has
          been successfully processed.
        </p>
        <p>If an ordered product becomes unavailable after payment has been received, we may:</p>
        <ul>
          <li>Offer an alternative product;</li>
          <li>Offer a replacement;</li>
          <li>Provide store credit; or</li>
          <li>Issue a refund for the unavailable item.</li>
        </ul>
      </Section>
      <Section title="6. Pricing">
        <p>All prices displayed on the website are shown in the currency indicated at checkout.</p>
        <p>Prices may change without prior notice.</p>
        <p>
          The price applicable to your order will generally be the price displayed at the time the order is successfully
          placed.
        </p>
        <p>We reserve the right to correct pricing errors, typographical mistakes, or incorrect product information.</p>
        <p>
          If a material pricing error occurs after an order is placed, we may contact you before processing or shipping
          the order.
        </p>
      </Section>
      <Section title="7. Taxes, Duties and Import Charges">
        <p>
          International orders may be subject to customs duties, import taxes, brokerage charges, VAT, GST, or other
          government fees imposed by the destination country.
        </p>
        <p>
          Unless expressly stated otherwise at checkout, these charges are not included in the product price or shipping
          cost.
        </p>
        <p>
          The customer is responsible for paying any applicable customs duties, import taxes, clearance fees, or similar
          charges imposed by the destination country.
        </p>
        <p>MUSAFIR is not responsible for delays caused by customs authorities.</p>
      </Section>
      <Section title="8. Orders">
        <p>When you place an order, you agree to provide accurate:</p>
        <ul>
          <li>Name</li>
          <li>Billing information</li>
          <li>Shipping address</li>
          <li>Contact information</li>
          <li>Payment information</li>
        </ul>
        <p>
          We reserve the right to accept, decline, cancel, or limit an order where reasonably necessary, including in
          cases involving:
        </p>
        <ul>
          <li>Suspected fraud;</li>
          <li>Payment authorization issues;</li>
          <li>Incorrect pricing;</li>
          <li>Product unavailability;</li>
          <li>Shipping restrictions;</li>
          <li>Incorrect customer information; or</li>
          <li>Unusual order activity.</li>
        </ul>
        <p>
          If we cancel an order after receiving payment, any amount properly due to you will be refunded through the
          applicable payment method where possible.
        </p>
      </Section>
      <Section title="9. Order Confirmation">
        <p>An automated order confirmation does not necessarily constitute final acceptance of an order.</p>
        <p>
          An order may remain subject to payment verification, inventory confirmation, fraud screening, and shipping
          eligibility.
        </p>
      </Section>
      <Section title="10. Payment">
        <p>
          Customers must pay the full amount shown during checkout using one of the payment methods made available on
          the website.
        </p>
        <p>
          By submitting payment details, you represent that you are authorized to use the selected payment method.
        </p>
        <p>
          MUSAFIR is not responsible for charges imposed by your bank, payment provider, credit card issuer, or
          currency conversion provider.
        </p>
      </Section>
      <Section title="11. Shipping and Delivery">
        <p>
          Estimated shipping and delivery times provided on the website are estimates only and are not guaranteed unless
          expressly stated otherwise.
        </p>
        <p>Delivery times may be affected by circumstances outside our reasonable control, including:</p>
        <ul>
          <li>Customs clearance;</li>
          <li>Courier delays;</li>
          <li>Weather;</li>
          <li>Public holidays;</li>
          <li>Transportation disruptions;</li>
          <li>Incorrect addresses;</li>
          <li>Import restrictions;</li>
          <li>Remote delivery locations; or</li>
          <li>Other events beyond our control.</li>
        </ul>
        <p>MUSAFIR will make reasonable efforts to process and dispatch orders promptly.</p>
      </Section>
      <Section title="12. Shipping Address">
        <p>Customers are responsible for providing a complete and accurate shipping address.</p>
        <p>
          MUSAFIR is not responsible for delivery delays, losses, additional charges, or failed deliveries
          resulting from an incorrect or incomplete address supplied by the customer.
        </p>
        <p>Where possible, customers should contact us immediately if an address correction is required.</p>
        <p>Address changes cannot be guaranteed after an order has been dispatched.</p>
      </Section>
      <Section title="13. Risk of Loss">
        <p>
          Responsibility for the shipment may transfer in accordance with the applicable courier arrangements and local
          law.
        </p>
        <p>
          Customers should inspect delivered packages promptly and notify us if there is visible transit damage or if an
          item is missing.
        </p>
      </Section>
      <Section title="14. Returns and Refunds">
        <p>
          Returns are governed by our separate <strong>Return &amp; Refund Policy</strong>.
        </p>
        <p>
          Eligible products may generally be returned within <strong>30 days</strong> in accordance with that policy.
        </p>
        <p>
          Unless the return results from our error or a verified defective or incorrect item,{" "}
          <strong>the customer is responsible for all return shipping costs and related return expenses</strong>.
        </p>
      </Section>
      <Section title="15. Customized and Personalized Products">
        <p>
          Products made specifically for a customer, including custom-sized, personalized, engraved, monogrammed,
          specially manufactured, or modified products, may not be eligible for return or exchange unless they arrive
          defective, damaged, or materially different from the confirmed order.
        </p>
        <p>Customers should carefully review all custom specifications before approving an order.</p>
      </Section>
      <Section title="16. Cancellations">
        <p>If you wish to cancel an order, contact us as soon as possible.</p>
        <p>
          Cancellation is not guaranteed once an order has entered production, processing, personalization, packing, or
          shipment.
        </p>
        <p>Customized or made-to-order products may become non-cancellable once production has begun.</p>
      </Section>
      <Section title="17. Incorrect or Damaged Products">
        <p>
          If you receive a product that is materially damaged, defective, or different from the item ordered, contact
          MUSAFIR promptly and provide:
        </p>
        <ul>
          <li>Your order number;</li>
          <li>A description of the issue;</li>
          <li>Clear photographs or videos where appropriate; and</li>
          <li>Any other information reasonably requested to assess the claim.</li>
        </ul>
        <p>
          We may provide an appropriate remedy depending on the circumstances, including replacement, repair, refund, or
          another suitable resolution.
        </p>
      </Section>
      <Section title="18. Product Use and Care">
        <p>
          Customers are responsible for selecting products that are appropriate for their intended use, size and fit.
        </p>
        <p>Products should be:</p>
        <ul>
          <li>Chosen using the size and fit information provided;</li>
          <li>Cared for according to the care instructions on the product page or garment label;</li>
          <li>Inspected on delivery; and</li>
          <li>Used only for their intended purpose as clothing or footwear.</li>
        </ul>
        <p>
          Contact MUSAFIR if you are unsure about size, fit or care before ordering.
        </p>
        <p>
          MUSAFIR is not responsible for damage resulting from misuse, improper care, unauthorized modification, normal
          wear and tear, or use contrary to product care instructions.
        </p>
      </Section>
      <Section title="19. Intellectual Property">
        <p>All content appearing on musafir.com, including but not limited to:</p>
        <ul>
          <li>Logos;</li>
          <li>Product photographs;</li>
          <li>Graphics;</li>
          <li>Videos;</li>
          <li>Website designs;</li>
          <li>Product descriptions;</li>
          <li>Written content;</li>
          <li>Branding;</li>
          <li>Icons;</li>
          <li>Artwork; and</li>
          <li>Other original materials</li>
        </ul>
        <p>
          is owned by or licensed to MUSAFIR and may be protected by copyright, trademark, and other intellectual
          property laws.
        </p>
        <p>
          You may not reproduce, distribute, copy, modify, republish, sell, commercially exploit, or create derivative
          works from our content without prior written permission.
        </p>
      </Section>
      <Section title="20. Prohibited Use">
        <p>You may not use our website:</p>
        <ul>
          <li>For unlawful purposes;</li>
          <li>To commit fraud;</li>
          <li>To interfere with website security;</li>
          <li>To distribute malicious code;</li>
          <li>To obtain unauthorized access to systems or accounts;</li>
          <li>To scrape or extract website content in violation of applicable law;</li>
          <li>To infringe intellectual property rights; or</li>
          <li>To misuse our brand, images, or product information.</li>
        </ul>
        <p>We reserve the right to restrict or terminate access where misuse is identified.</p>
      </Section>
      <Section title="21. Third-Party Services">
        <p>Our website may use third-party services including:</p>
        <ul>
          <li>Payment processors;</li>
          <li>Shipping carriers;</li>
          <li>Analytics providers;</li>
          <li>Hosting providers;</li>
          <li>Marketing platforms; and</li>
          <li>Other technology providers.</li>
        </ul>
        <p>
          We are not responsible for the independent actions, policies, availability, or content of third-party
          providers except where required by applicable law.
        </p>
      </Section>
      <Section title="22. Website Availability">
        <p>
          We aim to keep musafir.com available and functioning correctly, but uninterrupted or error-free access cannot
          be guaranteed.
        </p>
        <p>The website may occasionally be unavailable due to:</p>
        <ul>
          <li>Maintenance;</li>
          <li>Updates;</li>
          <li>Technical problems;</li>
          <li>Hosting interruptions;</li>
          <li>Security issues; or</li>
          <li>Circumstances outside our control.</li>
        </ul>
      </Section>
      <Section title="23. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, MUSAFIR will not be liable for indirect, incidental,
          special, consequential, or punitive damages arising from the use of our website, products, or services.
        </p>
        <p>
          Nothing in these Terms &amp; Conditions excludes or limits any rights or liabilities that cannot legally be
          excluded under applicable consumer protection law.
        </p>
      </Section>
      <Section title="24. Indemnification">
        <p>
          To the extent permitted by law, you agree to indemnify and hold MUSAFIR harmless from claims,
          liabilities, losses, damages, and reasonable expenses resulting from your unlawful use of the website, breach
          of these Terms &amp; Conditions, or infringement of another party&apos;s rights.
        </p>
      </Section>
      <Section title="25. Privacy">
        <p>
          Personal information submitted through musafir.com is handled in accordance with our Privacy Policy and
          applicable data protection requirements.
        </p>
        <p>
          Customers should review the Privacy Policy to understand how personal information may be collected, used,
          stored, and disclosed.
        </p>
      </Section>
      <Section title="26. Consumer Rights">
        <p>
          Nothing in these Terms &amp; Conditions is intended to remove or restrict any mandatory consumer rights
          available to you under applicable law.
        </p>
        <p>
          Where local consumer law provides rights that conflict with any provision of these Terms &amp; Conditions, the
          mandatory legal rights will apply.
        </p>
      </Section>
      <Section title="27. Governing Law">
        <p>
          These Terms &amp; Conditions shall be governed by the laws applicable to MUSAFIR&apos;s operating
          entity, subject to any mandatory consumer protection rights that apply in the customer&apos;s jurisdiction.
        </p>
        <p>
          Any dispute shall be handled by the competent courts or dispute-resolution authorities having jurisdiction
          under applicable law.
        </p>
      </Section>
      <Section title="28. Changes to These Terms">
        <p>MUSAFIR may revise these Terms &amp; Conditions periodically.</p>
        <p>
          The latest version will be published on musafir.com together with the applicable &quot;Last Updated&quot;
          date.
        </p>
      </Section>
      <Section title="29. Contact Us">
        <p>
          For questions regarding these Terms &amp; Conditions, orders, products, or customer service matters, please
          email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="info-page-link">
            {SUPPORT_EMAIL}
          </a>{" "}
          or use the contact information provided on <strong>musafir.com</strong>.
        </p>
      </Section>
    </>
  );
}
