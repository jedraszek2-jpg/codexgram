# Raport z wykorzystania Sztucznej Inteligencji w projekcie Codexgram

## 1. Wykaz użytych narzędzi AI
W procesie tworzenia aplikacji wykorzystałem dwa główne narzędzia:
*   **Codex (ChatGPT)** – główny asystent w edytorze VS Code, używany do generowania kodu, refaktoryzacji i debugowania.
*   **GitHub Copilot** – używany do uzupełniania kodu, a także do generowania dokumentacji prawnej (Terms of Service, Privacy Policy) na podstawie analizy kodu źródłowego.

## 2. Udział AI w projekcie
AI odegrało kluczową rolę na każdym etapie powstawania aplikacji:
*   **Architektura i Baza Danych:** Wygenerowanie schematu bazy danych w Convex (tabele: `profiles`, `posts`, `messages`, `stories`, `activities`).
*   **Integracja (Clerk + Convex):** Wygenerowanie logiki łączącej tokeny autoryzacyjne Clerka z bazą Convexa.
*   **UI/UX:** Wygenerowanie komponentów interfejsu na podstawie obrazków referencyjnych (np. ekran logowania, profilu, Stories).
*   **Funkcje Real-time:** Napisanie subskrypcji Convexa dla czatu (`useQuery`), dzięki czemu wiadomości pojawiają się natychmiast.
*   **Dokumentacja Prawna:** Wygenerowanie Regulaminu i Polityki Prywatności na podstawie audytu kodu (z użyciem placeholderów dla danych wrażliwych).

## 3. Wyzwania i "Human-in-the-loop" (Moje korekty)
Praca z AI wymagała ciągłej weryfikacji i podejmowania decyzji architektonicznych. Oto najważniejsze sytuacje, w których musiałem przejąć kontrolę:

*   **Pętle analityczne (Tool Loops):** Asystent AI często wpadał w pętlę weryfikacji, próbując w kółko czytać te same pliki (`Get-Content`) zamiast pisać kod. Musiałem ręcznie blokować te zapytania (opcja "Deny") i zmuszać go do generowania kodu.
*   **Bezpieczeństwo (Wyciek klucza):** Podczas jednej z sesji AI przypadkowo wypisało w logach terminala mój klucz `CLERK_SECRET_KEY`. Natychmiast zareagowałem, rotując klucz w panelu Clerk i bezpiecznie przechowując nowy w zmiennych środowiskowych Convexa.
*   **Błąd `process.env`:** AI wygenerowało akcję usuwania konta (Clerk API), która odwoływała się do `process.env`, co powodowało błąd TypeScriptu w Convexie. Musiałem samodzielnie zdiagnozować problem i nakazać AI dodanie pakietu `@types/node` oraz modyfikację pliku `convex/tsconfig.json`.
*   **Błąd base32 przy usuwaniu konta:** Implementacja usuwania danych z Convex Storage powodowała błąd rzutowania ID plików. Po kilku nieudanych próbach AI, nakazałem mu użycie funkcji `ctx.db.system.normalizeId()`, co ostatecznie rozwiązało problem.
*   **PowerShell i limity Windows:** AI kilkukrotnie próbowało zapisać zbyt duże bloki kodu jedną komendą, co kończyło się błędem limitu znaków w systemie Windows. Wymusiłem podział pracy na mniejsze partie.

## 4. Wnioski
AI jest niesamowitym narzędziem przyspieszającym development (tzw. "boilerplate" i powtarzalny kod), jednak nie zastępuje myślenia programisty. Kluczowe było zrozumienie, kiedy AI halucynuje lub wpada w pętle, oraz umiejętność ręcznego debugowania i podejmowania decyzji o architekturze (np. wybór Convex Storage zamiast Cloudflare R2).

## 5. Przykłady promptów (Prompt Engineering)
Poniżej znajdują się przykłady zaawansowanych promptów, których użyłem do wygenerowania kluczowej logiki w projekcie. Widać w nich podejście oparte na precyzyjnym określaniu kontekstu, wymagań technicznych i podziale na mniejsze kroki.

### Prompt 1: Implementacja pełnej funkcji usuwania konta (Backend + Frontend)
> Zaimplementujmy opcję 'Usuń konto' w ekranie edycji profilu (edit-profile.tsx), obok przycisku 'Wyloguj'. Chcę, aby usunięcie konta czyściło wszystkie dane w Convexie, ale pozwalało użytkownikowi na ponowną rejestrację na ten sam e-mail.
> 
> Wykonaj następujące kroki:
> 1. Backend (Convex): W pliku convex/social.ts (lub nowym convex/users.ts) stwórz mutację deleteMyAccount. Powinna ona usunąć profil użytkownika i wszystkie powiązane rekordy w tabelach: posts, comments, likes, follows, messages, conversations, stories, activities. Bardzo ważne: Przed usunięciem rekordów pobierz mediaId z postów/stories oraz avatarUrl z profilu i usuń te pliki z Convex Storage używając ctx.storage.delete().
> 2. Frontend (edit-profile.tsx): Dodaj na dole sekcję z przyciskami. Obok przycisku 'Wyloguj' (lub pod nim) dodaj czerwony przycisk "Usuń konto" (Delete Account). Po kliknięciu pokaż Alert z ostrzeżeniem: "Usunięcie konta usunie wszystkie Twoje posty, komentarze i wiadomości. Będziesz mógł jednak zarejestrować się ponownie na ten sam e-mail. Czy na pewno chcesz usunąć konto?". Po potwierdzeniu wywołaj mutację deleteMyAccount. Jeśli mutacja się powiedzie, wywołaj signOut() z @clerk/clerk-expo, aby wylogować użytkownika.
> 3. Routing: Upewnij się, że po wylogowaniu (lub przy kolejnym logowaniu) użytkownik bez profilu w Convexie trafia na ekran onboarding.tsx, gdzie będzie mógł utworzyć nowe konto.
> 
> Napisz kod i zapisz pliki. Masz już całą wiedzę o strukturze bazy.

### Prompt 2: Dodanie systemu lokalizacji (i18n) i zapisywanie preferencji
> Chcę dodać system lokalizacji (i18n) do aplikacji. Na razie dodajmy tylko wybór języka w profilu (Polska = polski, USA = angielski) i mechanizm zapisywania wyboru.
> 1. Zainstaluj i18next, react-i18next oraz expo-localization.
> 2. Stwórz plik src/lib/i18n.ts z podstawową konfiguracją (języki: 'pl' i 'en').
> 3. W ekranie Profilu (lub w Ustawieniach konta) dodaj przełącznik (np. dwa przyciski: 'Polski' i 'English'). Zapisuj wybór w AsyncStorage (lub w profilu Convexa).
> 4. Owiń główny komponent aplikacji w I18nextProvider.
> 5. Przetłumacz na razie tylko kilka kluczowych tekstów w aplikacji (np. 'Home', 'Profile', 'Log out'), żeby pokazać, że mechanizm działa. Reszta tekstów będzie tłumaczona później.

### Prompt 3: Naprawa logiki uwierzytelniania (Clerk)
> Mam poważny problem z logiką Clerka. Używanie osobnych ekranów z wymuszonym trybem signIn i signUp powoduje, że użytkownik nie może się zarejestrować (bo e-mail istnieje) ani zalogować (bo e-mail jest zajęty).
> Proszę, przełącz oba ekrany na tryb signInOrUp, który automatycznie rozpoznaje intencje użytkownika na podstawie e-maila:
> 1. W pliku src/app/sign-in.tsx zmień komponent na: <AuthView mode="signInOrUp" ... /> (upewnij się, że przekazujesz logo i inne wymagane propsy).
> 2. W pliku src/app/sign-up.tsx zrób dokładnie to samo: <AuthView mode="signInOrUp" ... />.
> 3. Sprawdź src/app/index.tsx (ekran startowy): Skoro oba ekrany będą teraz robić to samo (obsługiwać logowanie i rejestrację naraz), zmień przyciski na ekranie startowym. Zamiast dwóch osobnych przycisków ("Log in" i "Sign up"), zrób jeden wyraźny przycisk np. "Continue with Email" (lub "Sign in / Sign up"), który przekierowuje do /sign-in. Przycisk "Continue with Google" również powinien tam być.
> 
> Napisz kod, zapisz pliki i upewnij się, że nie ma błędów (typecheck/lint).