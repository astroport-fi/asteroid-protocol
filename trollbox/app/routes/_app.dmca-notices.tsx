import MarkdownPage from '~/components/MarkdownPage'

const md = `
**What is a DMCA Notice?**

A DMCA notice is also known as a DMCA takedown notice or a DMCA request. DMCA stands for Digital Millennium Copyright Act. A DMCA Takedown is when content is removed from a website or internet platform at the request of the owner of the content. The DMCA Takedown notice is a well-established and accepted internet standard followed by website owners and internet service providers everywhere.

 

Who can submit a DMCA Notice?



1. Content creators/owners
2. Copyright owners
3. Content publishers or distributors (with permission of the content or copyright owners)
4. NFT or inscription owners
5. Code writers and publishers
6. Social media users and participants
7. Individuals who are represented or contained within content published without permission

 

**How do I send a DMCA notice to Trollbox.app?**

Trollbox.app is operated by Delphi Labs Ltd, a British Virgin Islands company limited by shares. Delphi Labs complies with the provisions of the Digital Millennium Copyright Act applicable to Internet service providers (17 U.S.C. § 512, as amended). If you have an intellectual property rights-related complaint about any material on the Service, you may contact our Designated Agent via email at: <asteroidprotocol@proton.me> 

 

If you believe that any content made available on or through the Service has been used or exploited in a manner that infringes an intellectual property right you own or control, then please promptly send a written “Notification of Claimed Infringement” to the Designated Agent identified above containing the following information:



1. an electronic or physical signature of the person authorized to act on behalf of the owner of the copyright or other right being infringed;
2. a description of the copyrighted work or other intellectual property right that you claim has been infringed;
3. a description of the material that you claim is infringing and where it is located on the Service, including a URL representing a link to the material on Trollbox.app;
4. your address, telephone number, and email address;
5. a statement by you that you have a good faith belief that the use of the materials on the Service of which you are complaining is not authorized by the copyright or other intellectual property right owner, its agent, or the law; and
6. a statement by you that the above information in your notice is accurate and that, under penalty of perjury, you are the copyright or other intellectual property right owner or authorized to act on the copyright or intellectual property owner’s behalf.

Please Note: \


Your Notification of Claimed Infringement may be shared by Delphi Labs with the user alleged to have infringed a right you own or control as well as with the operators of publicly available databases that track notifications of claimed infringement, and you consent to Delphi Labs making such disclosures. You should consult with your own lawyer or see 17 U.S.C. § 512 to confirm your obligations to provide a valid notice of claimed infringement.

**My Content was removed. How do I submit a counter-DMCA notice?**

You will receive a notification with a reference number. You will need to reach out to <asteroidprotocol@proton.me> with this reference number to request a copy of the original DMCA notice. Once you have a copy of the original DMCA notice you can file a counter DMCA by emailing <asteroidprotocol@proton.me> or contacting our registered agent at the address listed in the previous segment. \
 \
If you receive a notification from Delphi Labs that material made available by you on or through the Service has been the subject of a Notification of Claimed Infringement, then you will have the right to provide Delphi Labs with what is called a “Counter Notification.” To be effective, a Counter Notification must be in writing, provided to Delphi Labs via email at Trollbox.app and include substantially the following information:



1. your physical or electronic signature;
2. identification of the material that has been removed or to which access has been disabled and the location at which the material appeared before it was removed or access to it was disabled;
3. a statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification of the material to be removed or disabled; and
4. your name, address, and telephone number, and a statement that you consent to the jurisdiction of Federal District Court for the judicial district in which the address is located, or if you are residing outside of the United States, then for any judicial district in which Delphi Labs may be found, and that you will accept service of process from the person who provided notification or an agent of that person.

 \
A party submitting a Counter Notification should consult a lawyer or see 17 U.S.C. § 512 to confirm the party’s obligations to provide a valid counter notification under the Copyright Act.

 

If you submit a Counter Notification to Delphi Labs in response to a Notification of Claimed Infringement, then Delphi Labs will promptly provide the person who provided the Notification of Claimed Infringement with a copy of your Counter Notification and inform that person that Delphi Labs will replace the removed User Content or cease disabling access to it in 10 business days, and Delphi Labs will replace the removed User Content and cease disabling access to it not less than 10, nor more than 14, business days following receipt of the Counter Notification, unless Delphi Labs receives notice from the party that submitted the Notification of Claimed Infringement that such person has filed an action seeking a court order to restrain the user from engaging in infringing activity relating to the material on Trollbox.app.

 

**False DMCA Notices:**

The Copyright Act provides at 17 U.S.C. § 512(f) that: “[a]ny person who knowingly materially misrepresents under [Section 512 of the Copyright Act (17 U.S.C.§ 512)] (1) that material or activity is infringing, or (2) that material or activity was removed or disabled by mistake or misidentification, will be liable for any damages, including costs and attorneys’ fees, incurred by the alleged infringer, by any copyright owner or copyright owner’s authorized licensee, or by a service provider, who is injured by such misrepresentation, as the result of [Delphi Labs] relying upon such misrepresentation in removing or disabling access to the material or activity claimed to be infringing, or in replacing the removed material or ceasing to disable access to it.”

 

Delphi Labs reserves the right to seek damages from any party that submits a Notification of Claimed Infringement or Counter Notification in violation of the law.`

export default function DmcaNoticesPage() {
  return <MarkdownPage title="DMCA Notices on Trollbox.app">{md}</MarkdownPage>
}
