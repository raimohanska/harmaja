export const sentences = `On 28 and 29 May 1959 (exactly one year after the Zürich ALGOL 58 meeting), a meeting was held at the Pentagon to discuss the creation of a common programming language for business. It was attended by 41 people and was chaired by Phillips.[19] The Department of Defense was concerned about whether it could run the same data processing programs on different computers. FORTRAN, the only mainstream language at the time, lacked the features needed to write such programs.[20]

Representatives enthusiastically described a language that could work in a wide variety of environments, from banking and insurance to utilities and inventory control. They agreed unanimously that more people should be able to program and that the new language should not be restricted by the limitations of contemporary technology. A majority agreed that the language should make maximal use of English, be capable of change, be machine-independent and be easy to use, even at the expense of power.[21]

The meeting resulted in the creation of a steering committee and short-, intermediate- and long-range committees. The short-range committee was given to September (three months) to produce specifications for an interim language, which would then be improved upon by the other committees.[22][23] Their official mission, however, was to identify the strengths and weaknesses of existing programming languages and did not explicitly direct them to create a new language.[20] The deadline was met with disbelief by the short-range committee.[24] One member, Betty Holberton, described the three-month deadline as "gross optimism" and doubted that the language really would be a stopgap.[25]

The steering committee met on 4 June and agreed to name the entire activity as the Committee on Data Systems Languages, or CODASYL, and to form an executive committee.[26]

The short-range committee was made up of members representing six computer manufacturers and three government agencies. The six computer manufacturers were Burroughs Corporation, IBM, Minneapolis-Honeywell (Honeywell Labs), RCA, Sperry Rand, and Sylvania Electric Products. The three government agencies were the US Air Force, the Navy's David Taylor Model Basin, and the National Bureau of Standards (now the National Institute of Standards and Technology).[27] The committee was chaired by Joseph Wegstein of the US National Bureau of Standards. Work began by investigating data description, statements, existing applications and user experiences.[28]

The committee mainly examined the FLOW-MATIC, AIMACO and COMTRAN programming languages.[20][29] The FLOW-MATIC language was particularly influential because it had been implemented and because AIMACO was a derivative of it with only minor changes.[30][31] FLOW-MATIC's inventor, Grace Hopper, also served as a technical adviser to the committee.[24] FLOW-MATIC's major contributions to COBOL were long variable names, English words for commands and the separation of data descriptions and instructions.[32] Hopper is sometimes referred to as "the mother of COBOL" or "the grandmother of COBOL",[33][34][35] although Jean Sammet, a lead designer of COBOL, stated that Hopper "was not the mother, creator or developer of Cobol".[36][37]

IBM's COMTRAN language, invented by Bob Bemer, was regarded as a competitor to FLOW-MATIC[38][39] by a short-range committee made up of colleagues of Grace Hopper.[40] Some of its features were not incorporated into COBOL so that it would not look like IBM had dominated the design process,[22] and Jean Sammet said in 1981 that there had been a "strong anti-IBM bias" from some committee members (herself included).[41] In one case, after Roy Goldfinger, author of the COMTRAN manual and intermediate-range committee member, attended a subcommittee meeting to support his language and encourage the use of algebraic expressions, Grace Hopper sent a memo to the short-range committee reiterating Sperry Rand's efforts to create a language based on English.[42] In 1980, Grace Hopper commented that "COBOL 60 is 95% FLOW-MATIC" and that COMTRAN had had an "extremely small" influence. Furthermore, she said that she would claim that work was influenced by both FLOW-MATIC and COMTRAN only to "keep other people happy [so they] wouldn't try to knock us out".[43] Features from COMTRAN incorporated into COBOL included formulas,[44] the PICTURE clause,[45] an improved IF statement, which obviated the need for GO TOs, and a more robust file management system.[38]

The usefulness of the committee's work was subject of great debate. While some members thought the language had too many compromises and was the result of design by committee, others felt it was better than the three languages examined. Some felt the language was too complex; others, too simple.[46] Controversial features included those some considered useless or too advanced for data processing users. Such features included boolean expressions, formulas and table subscripts (indices).[47][48] Another point of controversy was whether to make keywords context-sensitive and the effect that would have on readability.[47] Although context-sensitive keywords were rejected, the approach was later used in PL/I and partially in COBOL from 2002.[49] Little consideration was given to interactivity, interaction with operating systems (few existed at that time) and functions (thought of as purely mathematical and of no use in data processing).[50][51]

The specifications were presented to the Executive Committee on 4 September. They fell short of expectations: Joseph Wegstein noted that "it contains rough spots and requires some additions", and Bob Bemer later described them as a "hodgepodge". The subcommittee was given until December to improve it.[24]

At a mid-September meeting, the committee discussed the new language's name. Suggestions included "BUSY" (Business System), "INFOSYL" (Information System Language) and "COCOSYL" (Common Computer Systems Language).[52] It is unclear who coined the name "COBOL",[53][54] although Bob Bemer later claimed it was his suggestion.[55][56][57]

In October, the intermediate-range committee received copies of the FACT language specification created by Roy Nutt. Its features impressed the committee so much that they passed a resolution to base COBOL on it.[58] This was a blow to the short-range committee, who had made good progress on the specification. Despite being technically superior, FACT had not been created with portability in mind or through manufacturer and user consensus. It also lacked a demonstrable implementation,[24] allowing supporters of a FLOW-MATIC-based COBOL to overturn the resolution. RCA representative Howard Bromberg also blocked FACT, so that RCA's work on a COBOL implementation would not go to waste.[59]

'And what name do you want inscribed?'
I said, 'I'll write it for you.' I wrote the name down: COBOL.
'What kind of name is that?'
'Well it's a Polish name. We shortened it and got rid of a lot of unnecessary notation.'

Howard Bromberg on how he bought the COBOL tombstone[60]
It soon became apparent that the committee was too large for any further progress to be made quickly. A frustrated Howard Bromberg bought a $15 tombstone with "COBOL" engraved on it and sent it to Charles Phillips to demonstrate his displeasure.[b][60][62] A sub-committee was formed to analyze existing languages and was made up of six individuals:[20][63]

William Selden and Gertrude Tierney of IBM,
Howard Bromberg and Howard Discount of RCA,
Vernon Reeves and Jean E. Sammet of Sylvania Electric Products.
The sub-committee did most of the work creating the specification, leaving the short-range committee to review and modify their work before producing the finished specification.[20]

The specifications were approved by the Executive Committee on 8 January 1960, and sent to the government printing office, which printed these as COBOL 60. The language's stated objectives were to allow efficient, portable programs to be easily written, to allow users to move to new systems with minimal effort and cost, and to be suitable for inexperienced programmers.[64] The CODASYL Executive Committee later created the COBOL Maintenance Committee to answer questions from users and vendors and to improve and expand the specifications.[65]

During 1960, the list of manufacturers planning to build COBOL compilers grew. By September, five more manufacturers had joined CODASYL (Bendix, Control Data Corporation, General Electric (GE), National Cash Register and Philco), and all represented manufacturers had announced COBOL compilers. GE and IBM planned to integrate COBOL into their own languages, GECOM and COMTRAN, respectively. In contrast, International Computers and Tabulators planned to replace their language, CODEL, with COBOL.[66]

Meanwhile, RCA and Sperry Rand worked on creating COBOL compilers. The first COBOL program ran on 17 August on an RCA 501.[67] On 6 and 7 December, the same COBOL program (albeit with minor changes) ran on an RCA computer and a Remington-Rand Univac computer, demonstrating that compatibility could be achieved.[68]

The relative influences of which languages were used continues to this day in the recommended advisory printed in all COBOL reference manuals:

COBOL is an industry language and is not the property of any company or group of companies, or of any organization or group of organizations.

No warranty, expressed or implied, is made by any contributor or by the CODASYL COBOL Committee as to the accuracy and functioning of the programming system and language. Moreover, no responsibility is assumed by any contributor, or by the committee, in connection therewith. The authors and copyright holders of the copyrighted material used herein are as follows:

FLOW-MATIC (trademark of Unisys Corporation), Programming for the UNIVAC (R) I and II, Data Automation Systems, copyrighted 1958, 1959, by Unisys Corporation; IBM Commercial Translator Form No. F28-8013, copyrighted 1959 by IBM; FACT, DSI 27A5260-2760, copyrighted 1960 by Minneapolis-Honeywell.
They have specifically authorized the use of this material, in whole or in part, in the COBOL specifications. Such authorization extends to the reproduction and use of COBOL specifications in programming manuals or similar publications.[69]

Syntax
The concrete syntax of Rust is similar to C and C++, with blocks of code delimited by curly brackets, and control flow keywords such as if, else, while, and for. Not all C or C++ keywords are implemented, however, and some Rust functions (such as the use of the keyword match for pattern matching) will be less familiar to those versed in these languages. Despite the superficial resemblance to C and C++, the syntax of Rust in a deeper sense is closer to that of the ML family of languages and the Haskell language. Nearly every part of a function body is an expression,[29] even control flow operators. For example, the ordinary if expression also takes the place of C's ternary conditional. A function need not end with a return expression: in this case if the semicolon is omitted, the last expression in the function creates the return value.

Memory safety
Rust is designed to be memory safe, and thus it does not permit null pointers, dangling pointers, or data races in safe code.[30][31][32][33] Data values can only be initialized through a fixed set of forms, all of which require their inputs to be already initialized.[34] To replicate the function in other languages of pointers being either valid or NULL, such as in linked list or binary tree data structures, the Rust core library provides an option type, which can be used to test whether a pointer has Some value or None.[31] Rust also introduces added syntax to manage lifetimes, and the compiler reasons about these through its borrow checker.

Memory management
Rust does not use an automated garbage collection system like those used by Go, Java, or the .NET Framework. Instead, memory and other resources are managed through the resource acquisition is initialization (RAII) convention, with optional reference counting. Rust provides deterministic management of resources, with very low overhead.[citation needed] Rust also favors stack allocation of values and does not perform implicit boxing.

There is also a concept of references (using the & symbol), which do not involve run-time reference counting. The safety of using such pointers is verified at compile time by the borrow checker, preventing dangling pointers and other forms of undefined behavior.

Ownership
Rust has an ownership system where all values have a unique owner, and the scope of the value is the same as the scope of the owner.[35][36] Values can be passed by immutable reference, using &T, by mutable reference, using &mut T, or by value, using T. At all times, there can either be multiple immutable references or one mutable reference (an implicit readers-writer lock). The Rust compiler enforces these rules at compile time and also checks that all references are valid.

Types and polymorphism
The type system supports a mechanism similar to type classes, called "traits", inspired directly by the Haskell language. This is a facility for ad hoc polymorphism, achieved by adding constraints to type variable declarations. Other features from Haskell, such as higher-kinded polymorphism, are not yet supported.

Rust features type inference, for variables declared with the keyword let. Such variables do not require a value to be initially assigned to determine their type. A compile-time error results if any branch of code fails to assign a value to the variable.[37] Variables assigned multiple times must be marked with the keyword mut.

Functions can be given generic parameters, which usually require the generic type to implement a certain trait or traits. Within such a function, the generic value can only be used through those traits. This means that a generic function can be type-checked as soon as it is defined. This is in contrast to C++ templates, which are fundamentally duck typed and cannot be checked until instantiated with concrete types. C++ concepts address the same issue and are expected to be part of C++20 (2020).

However, the implementation of Rust generics is similar to the typical implementation of C++ templates: a separate copy of the code is generated for each instantiation. This is called monomorphization and contrasts with the type erasure scheme typically used in Java and Haskell. The benefit of monomorphization is optimized code for each specific use case; the drawback is increased compile time and size of the resulting binaries.

The object system within Rust is based around implementations, traits and structured types. Implementations fulfill a role similar to that of classes within other languages and are defined with the keyword impl. Inheritance and polymorphism are provided by traits; they allow methods to be defined and mixed in to implementations. Structured types are used to define fields. Implementations and traits cannot define fields themselves, and only traits can provide inheritance. Among other benefits, this prevents the diamond problem of multiple inheritance, as in C++. In other words, Rust supports interface inheritance, but replaces implementation inheritance with composition; see composition over inheritance.


`
    .split(".")
    .filter((x) => !x.includes("["))
    .map((x) => x.trim() + ". ")
