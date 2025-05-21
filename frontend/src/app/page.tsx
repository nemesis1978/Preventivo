import Image from "next/image";

export default function InvestmentTipsPage() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </div>

      {/* Investment Tips List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investmentTips.map((tip) => (
          <Card key={tip.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{tip.title}</CardTitle>
              <CardDescription>Categoria: {tip.category} - Rischio: {tip.risk}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>{tip.summary}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Vedi Dettagli</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination Section */}
      <div className="mt-8 flex justify-center items-center space-x-2">
        <Button variant="outline">Precedente</Button>
        <span className="text-sm text-muted-foreground">Pagina 1 di X</span>
        <Button variant="outline">Successivo</Button>
      </div>

      <footer className="mt-12 pt-8 border-t text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Portafoglio di Markowitz. Tutti i diritti riservati.</p>
        <p className="text-xs mt-1">
          Le informazioni fornite sono solo a scopo informativo e non costituiscono consulenza finanziaria.
        </p>
      </footer>
    </div>
  );
}
