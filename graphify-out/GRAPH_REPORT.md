# Graph Report - .  (2026-08-04)

## Corpus Check
- Large corpus: 655 files · ~224,345 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 3141 nodes · 8087 edges · 230 communities (130 shown, 100 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.84)
- Token cost: 0 input · 525,450 output

## Community Hubs (Navigation)
- Academies Page Component
- Graduation Requirements API Client
- Academy API Client
- Component Test Specs
- Create Belt Page Component
- Responsible Form API Client
- Lessons API Client
- Lesson Schedules API Client
- Frequencies API Client
- Admin Contract API Client
- Dashboard API Client
- Detail Student Page Component
- Notices API Client
- Angular Core Dependencies
- Accounts Receivable API Client
- Suppliers API Client
- Create Frequency Page Component
- Update Student Page Component
- Angular Core Dependencies
- Accounts Payable API Client
- Default API Client
- Belts API Client
- Tenant Settings API Client
- Responsible Form API Client
- Update Supplier DTOs & Models
- Graduations Page Component
- Create Accounts Receivable API Client
- Home Page Component
- Generated API Client Layer
- App API Client
- Persons API Client
- Students API Client
- Accounts Receivable DTOs & Models
- Sidebar Page Component
- Student Onboarding API Client
- Update Notice Page Component
- Financial Summary API Client
- Individual Persons API Client
- Student Onboarding DTOs & Models
- NPM Package Scripts
- Face Recognition DTOs & Models
- Contract API Client
- Dashboard API Client
- Public API Client
- Scheduled Jobs API Client
- Address Form DTOs & Models
- Contracts DTOs & Models
- Navbar Shared Service
- Accounts Receivable API Client
- Medical Clearances API Client
- Academy API Client
- Admin Accounts Receivable API Client
- Company Persons API Client
- Notification API Client
- Notification API Client
- Scheduled Job API Client
- Cashflow Chart Shared Service
- NPM Package Scripts
- Persons API Client
- Belts API Client
- Medical Clearance API Client
- Student Onboarding Page Component
- Students Page Component
- Angular CLI Schematics Config
- Accounts Receivable API Client
- Contract Terms Templates API Client
- Frequency API Client
- Graduation API Client
- My Academy API Client
- Create Contract Page Component
- Face Recognition Page Component
- Create Supplier Page Component
- Create Contract API Client
- Health API Client
- Create Notification API Client
- Update Academy DTOs & Models
- Accounts Payable Page Component
- Create Medical Clearance Page Component
- Notification Page Component
- Update Notification Page Component
- Project Docs & Conventions
- Contract API Client
- Graduation API Client
- Accounts Payable API Client
- Update Contract Terms Template DTOs & Models
- Academies Page Component
- Persons API Client
- Contract API Client
- Medical Clearance API Client
- Contract Terms Templates Page Component
- Fee Plans Page Component
- Medical Clearances Page Component
- Payment Settings Page Component
- Project Docs & Conventions
- Angular Coding Conventions
- Keycloak Auth Setup
- Academy API Client
- Admin Contract API Client
- Admin Monthly Fee API Client
- Contract Versions API Client
- Medical Clearance API Client
- Create Accounts Payable Page Component
- Create Accounts Receivable Page Component
- Belts Page Component
- Graduation Requirements Page Component
- Graduations Page Component
- Transaction Categories Page Component
- Avg Students By Class Page Component
- Cashflow Chart Page Component
- Angular Serve Config
- Blob Viewer Page Component
- Guard Page Component
- Notification API Client
- Create Graduation Page Component
- Update Graduation Page Component
- Overdue Fees Page Component
- Angular CLI Schematics Config
- Project Docs & Conventions
- Admin Student API Client
- Graduations API Client
- Public Contract API Client
- Public Student API Client
- Transaction Category API Client
- Generated API Client Layer
- Update Persons Page Component
- Frequencies Belt Distribution Page Component
- Angular Build Targets
- Project Docs & Conventions
- Address API Client
- Admin Notification API Client
- Admin Student API Client
- Asaas Webhook API Client
- Payment Webhook API Client
- Generated API Client Layer
- Academy Profile Page Component
- Student Onboarding Page Component
- Avg Belts By Class Page Component
- Datetime Module
- Angular Workspace Config
- Angular Build Configuration
- Address API Client
- Medical Clearance API Client
- Create Academy Page Component
- Create Graduation Requirement Page Component
- Update Graduation Requirement Page Component
- Shared Module
- Project Docs & Conventions
- Generated API Client Layer
- Pay Accounts Payable Page Component
- Accounts Receivable Module
- Payment With Money Page Component
- Update Belt Page Component
- Project Docs & Conventions
- OpenAPI Generator Config
- Financial Overview Balance API Client
- Notification API Client
- Generated API Client Layer
- Academies Module
- Create Contract Terms Template Page Component
- Update Contract Page Component
- Update Fee Plan Page Component
- Assets Module
- App Module
- Fee Plans Module
- Student Onboarding Page Component
- System Page Component
- Transaction Categories Module
- Interface Module
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Generated API Client Layer
- Loading Page Component
- Playwright Auth Setup
- ECharts Dependency
- Highcharts Dependency
- JWT Decode Dependency
- Karma/Jasmine Test Tooling
- Keycloak JS Dependency
- Luxon Date Library
- ng-bootstrap Dependency
- ngx-toastr Dependency
- Popper.js Dependency
- tslib Dependency
- Zone.js Dependency
- Playwright Test Framework
- Generated API Client Layer
- Generated API Client Layer
- System Module
- Fixtures Module
- Scheduled Jobs Module
- Company Module
- Flags Module
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- App Navigation Shell
- Structural Icons Module
- Structural Icons Module
- Structural Icons Module
- Structural Icons Module
- Structural Icons Module
- Structural Icons Module
- Structural Icons Module
- Assets Module

## God Nodes (most connected - your core abstractions)
1. `ApiFrequencyGetPageParameter` - 201 edges
2. `Configuration` - 158 edges
3. `extractErrorMessage()` - 140 edges
4. `NotificationService` - 130 edges
5. `FieldErrorComponent` - 63 edges
6. `SubnavService` - 59 edges
7. `ProblemDetails` - 55 edges
8. `FilterComponent` - 49 edges
9. `StudentsService` - 46 edges
10. `ConfirmService` - 46 edges

## Surprising Connections (you probably didn't know these)
- `src/index.html — App Entry Point (title: RX Jiu-Jitsu)` --conceptually_related_to--> `README.md — Jiu-Admin Project Overview`  [AMBIGUOUS]
  src/index.html → README.md
- `NotificationService (wrapper around PrimeNG MessageService, per SKILL.md)` --semantically_similar_to--> `NotificationService (never alert()/raw console)`  [INFERRED] [semantically similar]
  .github/skills/angular_skills/SKILL.md → README.md
- `UI Convention: Bootstrap 5 + ng-bootstrap (table, modal, btn, badge, select, input, spinner, alert)` --conceptually_related_to--> `UI Components Decision: PrimeNG 19 LTS (p-table, p-dialog, p-select/inputtext/button, p-paginator, p-toast+MessageService)`  [AMBIGUOUS]
  .github/copilot-instructions.md → README.md
- `accounts-payable.component.html — Accounts Payable List Page` --conceptually_related_to--> `Create/Update Dialog Pattern: parent owns openedCreate/selected signals; child emits itemCreated/closeEvent; parent wraps child in Bootstrap modal`  [INFERRED]
  src/app/pages/system/accounts-payable/accounts-payable.component.html → .github/copilot-instructions.md
- `accounts-receivable.component.html — Accounts Receivable List Page` --conceptually_related_to--> `Create/Update Dialog Pattern: parent owns openedCreate/selected signals; child emits itemCreated/closeEvent; parent wraps child in Bootstrap modal`  [INFERRED]
  src/app/pages/system/accounts-receivable/accounts-receivable.component.html → .github/copilot-instructions.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared List-Page Pattern (filter/search + Bootstrap table + pagination + create modal)** — src_app_pages_system_academies_academies_component_template, src_app_pages_system_accounts_payable_accounts_payable_component_template, src_app_pages_system_accounts_receivable_accounts_receivable_component_template [INFERRED 0.85]
- **Create/Update Dialog Child-Form Pattern (form-only content, closeEvent/itemCreated outputs, Cancelar/Salvar buttons)** — src_app_pages_system_academies_create_academy_create_academy_component_template, src_app_pages_system_academies_update_academy_update_academy_component_template, src_app_pages_system_accounts_payable_create_accounts_payable_create_accounts_payable_component_template, src_app_pages_system_accounts_payable_pay_accounts_payable_pay_accounts_payable_component_template, src_app_pages_system_accounts_receivable_create_accounts_receivable_create_accounts_receivable_component_template [INFERRED 0.85]
- **UI Framework Documentation Discrepancy: README.md claims PrimeNG 19 LTS, but copilot-instructions.md/SKILL.md mandate Bootstrap 5 + ng-bootstrap, and actual templates use Bootstrap classes** — readme_ui_components_primeng, github_copilot_instructions_ui_bootstrap5, github_skills_angular_skills_skill_bootstrap5_patterns, src_app_pages_system_academies_academies_component_template [INFERRED 0.75]
- **CRUD List Management Pattern (filter + paginated table + create/update modals)** — src_app_pages_system_belts_belts_component_beltscomponent, src_app_pages_system_contract_terms_templates_contract_terms_templates_component_contracttermstemplatescomponent, src_app_pages_system_contracts_contracts_component_contractscomponent, src_app_pages_system_fee_plans_fee_plans_component_feeplanscomponent, src_app_pages_system_frequencies_frequencies_component_frequenciescomponent, src_app_pages_system_face_recognition_face_recognition_component_facerecognitioncomponent, src_app_pages_system_graduation_requirements_graduation_requirements_component_graduationrequirementscomponent [INFERRED 0.85]
- **Contract Lifecycle Management Flow (create, edit, send for confirmation, version history)** — src_app_pages_system_contracts_contracts_component_contractscomponent, src_app_pages_system_contracts_create_contract_create_contract_component_createcontractcomponent, src_app_pages_system_contracts_update_contract_update_contract_component_updatecontractcomponent, src_app_pages_system_contracts_contract_versions_contract_versions_component_contractversionscomponent [EXTRACTED 1.00]
- **Face Recognition Attendance Pipeline (register faces, then auto-recognize for attendance)** — src_app_pages_system_face_recognition_face_recognition_component_facerecognitioncomponent, src_app_pages_system_face_recognition_create_persons_create_persons_component_createpersonscomponent, src_app_pages_system_face_recognition_update_persons_update_persons_component_updatepersonscomponent, src_app_pages_system_frequencies_create_frequency_create_frequency_component_createfrequencycomponent [INFERRED 0.85]
- **Home Dashboard Widget Composition** — src_app_pages_system_home_home_component_template, src_app_shared_dashboard_components_quick_actions_quick_actions_component_quickactionscomponent, src_app_shared_dashboard_components_new_students_this_month_new_students_this_month_component_newstudentsthismonthcomponent, src_app_shared_dashboard_components_frequencies_belt_distribution_frequencies_belt_distribution_component_frequenciesbeltdistributioncomponent, src_app_shared_dashboard_components_avg_students_by_class_avg_students_by_class_component_avgstudentsbyclasscomponent, src_app_shared_dashboard_components_top_students_top_students_component_topstudentscomponent, src_app_shared_dashboard_components_birthday_this_month_birthday_this_month_component_birthdaythismonthcomponent [INFERRED 0.85]
- **Graduations CRUD Flow with Inline Belt Creation** — src_app_pages_system_graduations_graduations_component_template, src_app_pages_system_graduations_create_graduation_create_graduation_component_template, src_app_pages_system_graduations_update_graduation_update_graduation_component_template, src_app_pages_system_belts_create_belt_create_belt_component_createbeltcomponent [INFERRED 0.75]
- **Notification CRUD Flow** — src_app_pages_system_notification_notification_component_template, src_app_pages_system_notification_create_notification_create_notification_component_template, src_app_pages_system_notification_update_notification_update_notification_component_template [INFERRED 0.75]
- **Student Onboarding Wizard Steps** — src_app_pages_system_student_onboarding_student_onboarding_component_studentonboardingcomponent, src_app_pages_system_student_onboarding_onboarding_basic_form_component_onboardingbasicformcomponent, src_app_pages_system_student_onboarding_onboarding_belt_form_component_onboardingbeltformcomponent, src_app_pages_system_student_onboarding_onboarding_contract_form_component_onboardingcontractformcomponent, src_app_pages_system_student_onboarding_onboarding_confirmation_component_onboardingconfirmationcomponent [EXTRACTED 1.00]
- **List + Create/Update Modal CRUD Pattern** — src_app_pages_system_students_students_component_studentscomponent, src_app_pages_system_suppliers_suppliers_component_supplierscomponent, src_app_pages_system_transaction_categories_transaction_categories_component_transactioncategoriescomponent [INFERRED 0.85]
- **Shared Address Form Reused Across Entity Forms** — src_app_shared_address_form_address_form_component_addressformcomponent, src_app_pages_system_students_create_student_create_student_component_createstudentcomponent, src_app_pages_system_students_update_student_update_student_component_updatestudentcomponent, src_app_pages_system_suppliers_create_supplier_create_supplier_component_createsuppliercomponent, src_app_pages_system_suppliers_update_supplier_update_supplier_component_updatesuppliercomponent [INFERRED 0.85]
- **Shared dashboard-card layout pattern** — src_app_shared_dashboard_components_frequencies_belt_distribution_frequencies_belt_distribution_component_frequenciesbeltdistributioncomponent, src_app_shared_dashboard_components_new_students_this_month_new_students_this_month_component_newstudentsthismonthcomponent, src_app_shared_dashboard_components_overdue_fees_overdue_fees_component_overduefeescomponent, src_app_shared_dashboard_components_quick_actions_quick_actions_component_quickactionscomponent, src_app_shared_dashboard_components_top_students_top_students_component_topstudentscomponent [INFERRED 0.85]
- **Shared loading()/error() Angular signal control-flow pattern** — src_app_shared_dashboard_components_new_students_this_month_new_students_this_month_component_newstudentsthismonthcomponent, src_app_shared_dashboard_components_overdue_fees_overdue_fees_component_overduefeescomponent, src_app_shared_dashboard_components_top_students_top_students_component_topstudentscomponent [INFERRED 0.85]
- **App-shell navigation controls (navbar toggle, sidebar links, quick-action shortcuts)** — src_app_shared_navbar_navbar_component_navbarcomponent, src_app_shared_sidebar_sidebar_component_sidebarcomponent, src_app_shared_dashboard_components_quick_actions_quick_actions_component_quickactionscomponent [INFERRED 0.75]

## Communities (230 total, 100 thin omitted)

### Community 0 - "Academies Page Component"
Cohesion: 0.07
Nodes (47): MOCK_ITEMS, MOCK_TEMPLATE, MOCK_FREQUENCY, MOCK_ITEMS, MOCK_ITEMS, MOCK_REQUIREMENT, MOCK_GRADUATION, MOCK_ITEMS (+39 more)

### Community 1 - "Graduation Requirements API Client"
Cohesion: 0.04
Nodes (43): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, GraduationRequirementsService, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, Injectable, GraduationRequirementsServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NoticesServiceInterface (+35 more)

### Community 2 - "Academy API Client"
Cohesion: 0.08
Nodes (44): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, APIS, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+36 more)

### Community 3 - "Component Test Specs"
Cohesion: 0.09
Nodes (45): AcademyProfile, waitForFormReady(), openCreateDialog(), timestamp, NOTE: contract cancellation (not real deletion) and the FK constraint on, NOTE: student/fee-plan intentionally not cleaned up — same FK constraint as the…, NOTE: student/fee-plan intentionally not cleaned up — same FK constraint as the…, NOTE: the fee-plan and student created above intentionally aren't cleaned up (+37 more)

### Community 4 - "Create Belt Page Component"
Cohesion: 0.08
Nodes (30): CreateBeltComponent, Component, CreateFeePlanComponent, Component, Create Graduation Requirement Template, Update Graduation Requirement Template, Create Graduation Template, Update Graduation Template (+22 more)

### Community 5 - "Responsible Form API Client"
Cohesion: 0.05
Nodes (26): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, StudentsService, Injectable, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, EXPECTED_FORM_VALUE, MOCK_ACADEMY, RefundAccountsReceivableComponent, Component (+18 more)

### Community 6 - "Lessons API Client"
Cohesion: 0.06
Nodes (24): LessonService, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, Inject, Injectable, Optional, LessonServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateLessonDTO (+16 more)

### Community 7 - "Lesson Schedules API Client"
Cohesion: 0.07
Nodes (23): LessonScheduleService, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, Inject, Injectable, Optional, LessonScheduleServiceInterface, CreateLessonScheduleDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+15 more)

### Community 8 - "Frequencies API Client"
Cohesion: 0.06
Nodes (15): FrequencyService, Inject, Injectable, Optional, FrequencyServiceInterface, CreateFrequencyDTO, PaginatedResultOfShowFrequencyDTO, ShowFrequencyDTO (+7 more)

### Community 9 - "Admin Contract API Client"
Cohesion: 0.05
Nodes (24): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, AdminContractServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, AdminMonthlyFeeServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, AdminNotificationServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, AsaasWebhookServiceInterface (+16 more)

### Community 10 - "Dashboard API Client"
Cohesion: 0.07
Nodes (24): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ApiMedicalClearanceIdAttachmentUrlGetExpiryHoursParameter, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+16 more)

### Community 11 - "Detail Student Page Component"
Cohesion: 0.07
Nodes (4): DetailStudentComponent, Component, DetailSupplierComponent, Component

### Community 12 - "Notices API Client"
Cohesion: 0.08
Nodes (13): NoticesService, Inject, Injectable, Optional, CreateNoticeDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowNoticeDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+5 more)

### Community 13 - "Angular Core Dependencies"
Cohesion: 0.06
Nodes (35): @angular/build, @angular/compiler-cli, dotenv, jasmine-core, karma, karma-coverage, karma-jasmine, karma-jasmine-html-reporter (+27 more)

### Community 14 - "Accounts Receivable API Client"
Cohesion: 0.09
Nodes (9): AccountsReceivableService, Inject, Injectable, Optional, AccountsReceivableServiceInterface, ApiAccountsPayableGetAmountMinParameter, CreateFeePlanDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+1 more)

### Community 15 - "Suppliers API Client"
Cohesion: 0.09
Nodes (8): SupplierService, Inject, Injectable, Optional, SupplierServiceInterface, ShowSupplierDTO, SuppliersComponent, Component

### Community 16 - "Create Frequency Page Component"
Cohesion: 0.08
Nodes (4): CreatePersonsComponent, Component, CreateFrequencyComponent, Component

### Community 17 - "Update Student Page Component"
Cohesion: 0.08
Nodes (8): CreateStudentComponent, Component, buildResponsibleFormGroup(), Component, UpdateStudentComponent, buildAddressFormGroup(), calculateAge(), isMinor()

### Community 18 - "Angular Core Dependencies"
Cohesion: 0.06
Nodes (31): @angular/animations, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/localize, @angular/platform-browser, @angular/platform-browser-dynamic (+23 more)

### Community 19 - "Accounts Payable API Client"
Cohesion: 0.09
Nodes (12): AccountsPayableService, Inject, Injectable, Optional, AccountsPayableServiceInterface, CreateAccountsPayableDTO, PayAccountsPayableDTO, ShowAccountsPayableDTO (+4 more)

### Community 20 - "Default API Client"
Cohesion: 0.09
Nodes (11): APIS, DefaultService, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, Inject, Injectable, Optional, DefaultServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+3 more)

### Community 21 - "Belts API Client"
Cohesion: 0.11
Nodes (14): BeltServiceInterface, CreateBeltDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateBeltDTOOrderIndex, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, PaginatedResultOfShowBeltDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+6 more)

### Community 22 - "Tenant Settings API Client"
Cohesion: 0.11
Nodes (15): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, TenantSettingsService, Inject, Injectable, Optional, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, TenantSettingsServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+7 more)

### Community 23 - "Responsible Form API Client"
Cohesion: 0.11
Nodes (18): CreatePersonRelationshipDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateStudentDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, RelationshipType, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowAddressDTO (+10 more)

### Community 24 - "Update Supplier DTOs & Models"
Cohesion: 0.12
Nodes (12): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, UpdateAddressDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, UpdateCompanyPersonDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, UpdateIndividualPersonDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+4 more)

### Community 25 - "Graduations Page Component"
Cohesion: 0.09
Nodes (11): Graduations List Template, Lesson Schedules List Template, Lessons List Template, Medical Clearances List Template, Notification List Template, FilterComponent, NAME_FIELD, STATUS_FIELD (+3 more)

### Community 26 - "Create Accounts Receivable API Client"
Cohesion: 0.13
Nodes (15): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateAccountsReceivableDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, FeeStatus, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+7 more)

### Community 27 - "Home Page Component"
Cohesion: 0.11
Nodes (12): HomeComponent, Home Dashboard Template, Component, BirthdayThisMonthComponent, Component, NewStudentsThisMonthComponent, Component, QuickAction (+4 more)

### Community 28 - "Generated API Client Layer"
Cohesion: 0.11
Nodes (14): ApiModule, NgModule, Optional, SkipSelf, Configuration, ConfigurationParameters, DataFormat, DataType (+6 more)

### Community 29 - "App API Client"
Cohesion: 0.10
Nodes (14): AppComponent, Component, appConfig, AppModule, NgModule, AppRoutingModule, routes, NgModule (+6 more)

### Community 30 - "Persons API Client"
Cohesion: 0.14
Nodes (15): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ErrorResponse, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, FaceLocation, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, HTTPValidationError, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+7 more)

### Community 31 - "Students API Client"
Cohesion: 0.12
Nodes (6): StudentsServiceInterface, ShowStudentDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowStudentDTOPaginatedResult, UpdateStudentDTO, UploadPhotoBase64DTO

### Community 32 - "Accounts Receivable DTOs & Models"
Cohesion: 0.14
Nodes (3): ShowAccountsReceivableDTO, AccountsReceivableComponent, Component

### Community 33 - "Sidebar Page Component"
Cohesion: 0.12
Nodes (8): NAV_SECTIONS, NavItem, NavSection, SidebarComponent, Component, NAV_ITEMS, SubnavComponent, Component

### Community 34 - "Student Onboarding API Client"
Cohesion: 0.12
Nodes (9): FeePlanService, Inject, Injectable, Optional, FeePlanServiceInterface, ShowFeePlanDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowFeePlanDTOPaginatedResult (+1 more)

### Community 35 - "Update Notice Page Component"
Cohesion: 0.11
Nodes (9): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateNoticeComponent, Component, MOCK_ITEMS, MOCK_NOTICE, Notices List Template, MOCK_NOTICE, Component (+1 more)

### Community 36 - "Financial Summary API Client"
Cohesion: 0.13
Nodes (10): FinancialOverviewService, Inject, Injectable, Optional, FinanceDashboardComponent, Component, FinancialSummaryComponent, MOCK_BALANCE (+2 more)

### Community 37 - "Individual Persons API Client"
Cohesion: 0.13
Nodes (8): IndividualPersonsService, Inject, Injectable, Optional, IndividualPersonsServiceInterface, PaginatedResultOfShowIndividualPersonDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowIndividualPersonDTO

### Community 38 - "Student Onboarding DTOs & Models"
Cohesion: 0.17
Nodes (12): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, OnboardingBasicFormComponent, Component, emptyBasicInfo(), emptyBeltInfo(), emptyContractInfo(), emptyMedicalInfo(), StudentBasicInfo (+4 more)

### Community 39 - "NPM Package Scripts"
Cohesion: 0.13
Nodes (20): options, assets, browser, index, inlineStyleLanguage, outputPath, polyfills, scripts (+12 more)

### Community 40 - "Face Recognition DTOs & Models"
Cohesion: 0.22
Nodes (12): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, FaceImageResponse, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, PersonDetailResponse, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, PersonListResponse, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+4 more)

### Community 41 - "Contract API Client"
Cohesion: 0.13
Nodes (8): ContractServiceInterface, ContractStatus, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, PaginatedResultOfShowContractDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, UpdateContractStatusRequest

### Community 42 - "Dashboard API Client"
Cohesion: 0.17
Nodes (6): DashboardService, Inject, Injectable, Optional, DashboardServiceInterface, ApiDashboardAttendanceGetDaysParameter

### Community 43 - "Public API Client"
Cohesion: 0.13
Nodes (10): PublicService, Inject, Injectable, Optional, PublicServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, PublicAcademyDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+2 more)

### Community 44 - "Scheduled Jobs API Client"
Cohesion: 0.15
Nodes (7): ScheduledJobService, Inject, Injectable, Optional, ShowScheduledJobDto, ScheduledJobsComponent, Component

### Community 45 - "Address Form DTOs & Models"
Cohesion: 0.21
Nodes (12): AddressType, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateAddressDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateCompanyPersonDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateIndividualPersonDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+4 more)

### Community 46 - "Contracts DTOs & Models"
Cohesion: 0.16
Nodes (5): ShowContractDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowContractDTOPaginatedResult, ContractsComponent, Component

### Community 47 - "Navbar Shared Service"
Cohesion: 0.12
Nodes (4): AuthServiceService, Injectable, NavbarComponent, Component

### Community 48 - "Accounts Receivable API Client"
Cohesion: 0.15
Nodes (9): ChargeStatus, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ChargeStatusConfirmedValue, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, PayAccountsReceivableDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+1 more)

### Community 49 - "Medical Clearances API Client"
Cohesion: 0.14
Nodes (7): CreateMedicalClearanceDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowMedicalClearanceDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowMedicalClearanceDtoAttachmentSize, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowMedicalClearanceDtoPaginatedResult

### Community 50 - "Academy API Client"
Cohesion: 0.18
Nodes (8): AcademyServiceInterface, CreateAcademyDto, PaginatedResultOfShowAcademyDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowAcademyDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowAcademyDtoPaginatedResult

### Community 51 - "Admin Accounts Receivable API Client"
Cohesion: 0.17
Nodes (8): AdminAccountsReceivableService, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, Inject, Injectable, Optional, AdminAccountsReceivableServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, GenerateFinancialTransactionsResultDTO

### Community 52 - "Company Persons API Client"
Cohesion: 0.16
Nodes (6): CompanyPersonsService, Inject, Injectable, Optional, CompanyPersonsServiceInterface, ShowCompanyPersonDTO

### Community 53 - "Notification API Client"
Cohesion: 0.19
Nodes (3): NotificationService, Injectable, NotificationType

### Community 55 - "Scheduled Job API Client"
Cohesion: 0.18
Nodes (10): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ScheduledJobServiceInterface, ProblemDetailsStatus, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ScheduledJobCadence, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-… (+2 more)

### Community 56 - "Cashflow Chart Shared Service"
Cohesion: 0.18
Nodes (5): Theme, ThemeService, Injectable, fetchAllPages(), PT_MONTHS

### Community 57 - "NPM Package Scripts"
Cohesion: 0.12
Nodes (15): name, private, scripts, build, e2e, e2e:report, e2e:ui, generate:all (+7 more)

### Community 58 - "Persons API Client"
Cohesion: 0.17
Nodes (4): PersonsService, Inject, Injectable, Optional

### Community 59 - "Belts API Client"
Cohesion: 0.14
Nodes (6): BeltService, Injectable, MOCK_BELT, MOCK_ITEMS, MOCK_BELT, MOCK_REQUIREMENT

### Community 60 - "Medical Clearance API Client"
Cohesion: 0.19
Nodes (4): MedicalClearanceService, Inject, Injectable, Optional

### Community 61 - "Student Onboarding Page Component"
Cohesion: 0.13
Nodes (4): OnboardingBeltFormComponent, Component, StudentOnboardingComponent, Component

### Community 63 - "Angular CLI Schematics Config"
Cohesion: 0.13
Nodes (15): schematics, type, typeSeparator, typeSeparator, typeSeparator, typeSeparator, typeSeparator, type (+7 more)

### Community 64 - "Accounts Receivable API Client"
Cohesion: 0.21
Nodes (8): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, AccountsReceivableSummaryDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ChargeResult, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ChargeTransactionDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 65 - "Contract Terms Templates API Client"
Cohesion: 0.19
Nodes (6): ContractTermsTemplateServiceInterface, CreateContractTermsTemplateDTO, PaginatedResultOfShowContractTermsTemplateDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowContractTermsTemplateDTO, UpdateContractTermsTemplateDTO

### Community 66 - "Frequency API Client"
Cohesion: 0.17
Nodes (8): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowFrequencyUntilNextGraduationDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 67 - "Graduation API Client"
Cohesion: 0.22
Nodes (4): GraduationService, Injectable, GraduationServiceInterface, PaginatedResultOfShowGraduationDTO

### Community 68 - "My Academy API Client"
Cohesion: 0.15
Nodes (7): MyAcademyService, Inject, Injectable, Optional, MyAcademyServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, UpdateMyAcademyDto

### Community 72 - "Create Contract API Client"
Cohesion: 0.16
Nodes (7): ContractTermsTemplateService, Inject, Injectable, Optional, MOCK_FEE_PLANS, MOCK_STUDENTS, MOCK_TEMPLATES

### Community 73 - "Health API Client"
Cohesion: 0.15
Nodes (5): HealthService, Inject, Injectable, Optional, HealthServiceInterface

### Community 74 - "Create Notification API Client"
Cohesion: 0.21
Nodes (5): CreateNotificationDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateNotificationComponent, Component

### Community 75 - "Update Academy DTOs & Models"
Cohesion: 0.19
Nodes (6): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, UpdateAcademyDto, EMPTY_DTO_FIELDS, MOCK_ACADEMY, Component, UpdateAcademyComponent

### Community 79 - "Update Notification Page Component"
Cohesion: 0.25
Nodes (6): MOCK_NOTIFICATION, Component, UpdateNotificationComponent, dateStringToIso(), datetimeLocalToIso(), isoToDatetimeLocal()

### Community 80 - "Project Docs & Conventions"
Cohesion: 0.19
Nodes (13): Authentication Convention: Keycloak PKCE via keycloak-angular, AuthGuard requires manage-realm AND manage-users, Keycloak Integration: reading user info, hasRealmRole, logout, AuthGuard on routes, silent-check-sso.html — Keycloak silent SSO check page, Angular 19 (standalone + signals), Auth Architecture Decision: keycloak-angular handles token storage/refresh/bearer; AuthGuard requires manage-realm + manage-users roles, Change Detection Decision: OnPush everywhere, signals integrate automatically, README.md — Jiu-Admin Project Overview, Environment Configuration (enviroments/ dir, typo kept intentionally) (+5 more)

### Community 81 - "Contract API Client"
Cohesion: 0.18
Nodes (4): ContractService, Inject, Injectable, Optional

### Community 82 - "Graduation API Client"
Cohesion: 0.22
Nodes (7): BaseGraduationDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateGraduationDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, StripesEnum, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 83 - "Accounts Payable API Client"
Cohesion: 0.19
Nodes (5): CreateTransactionCategoryDTO, ShowTransactionCategoryDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowTransactionCategoryDTOPaginatedResult, UpdateTransactionCategoryDTO

### Community 84 - "Update Contract Terms Template DTOs & Models"
Cohesion: 0.22
Nodes (5): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CONTRACT_TERMS_QUILL_MODULES, MOCK_TEMPLATE, Component, UpdateContractTermsTemplateComponent

### Community 86 - "Persons API Client"
Cohesion: 0.17
Nodes (3): PersonsServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, RegisterMultipleResponse

### Community 87 - "Contract API Client"
Cohesion: 0.23
Nodes (7): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, CreateContractDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, SendContractForConfirmationResultDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 93 - "Project Docs & Conventions"
Cohesion: 0.18
Nodes (11): Angular 19 Conventions: inject(), signals, input()/output(), @if/@for, OnPush, standalone always, .github/copilot-instructions.md — Copilot Instructions, Reference to '.github/skills.md' for full component guidelines, Layout Convention: CSS Grid (no Bootstrap row/col), CSS custom properties for brand colors, NotificationService (never call MessageService directly), UI Convention: Bootstrap 5 + ng-bootstrap (table, modal, btn, badge, select, input, spinner, alert), Bootstrap 5 Patterns: tables, dialogs, buttons, form inputs, badges, toasts (ngx-toastr), Bootstrap Icons, Layout & Styling: CSS Grid, CSS custom properties for brand colors, no Bootstrap classes, no inline styles (+3 more)

### Community 94 - "Angular Coding Conventions"
Cohesion: 0.18
Nodes (11): angular_skills SKILL.md — Copilot Skills & Coding Guidelines, FilterComponent (app-filter) usage pattern, inject() field-level injection — no constructor injection, Signal-based input()/output() — no @Input()/@Output() decorators, OnPush change detection (always), Signals for all component state (signal/computed/effect), Standalone Components (always) convention, Subnav Page Title: call subnavService.setTitle() in ngOnInit (+3 more)

### Community 95 - "Keycloak Auth Setup"
Cohesion: 0.33
Nodes (5): clearKeycloakStorage(), keycloakInitFactory(), runFactory(), keycloakProviders, environment

### Community 96 - "Academy API Client"
Cohesion: 0.22
Nodes (4): AcademyService, Inject, Injectable, Optional

### Community 97 - "Admin Contract API Client"
Cohesion: 0.22
Nodes (6): AdminContractService, Inject, Injectable, Optional, ApiAdminContractsSendRenewalWarningsPostDaysAheadParameter, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 98 - "Admin Monthly Fee API Client"
Cohesion: 0.22
Nodes (6): AdminMonthlyFeeService, Inject, Injectable, Optional, GenerateMonthlyFeesResultDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 99 - "Contract Versions API Client"
Cohesion: 0.20
Nodes (5): ShowContractVersionDTO, ContractVersionsComponent, MOCK_CONTRACT, MOCK_VERSIONS, Component

### Community 100 - "Medical Clearance API Client"
Cohesion: 0.25
Nodes (6): EntityTagHeaderValue, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, FileResult, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, StringSegment

### Community 107 - "Avg Students By Class Page Component"
Cohesion: 0.27
Nodes (3): AvgStudentsByClassComponent, Component, ViewChild

### Community 108 - "Cashflow Chart Page Component"
Cohesion: 0.29
Nodes (3): CashflowChartComponent, Component, ViewChild

### Community 109 - "Angular Serve Config"
Cohesion: 0.20
Nodes (10): serve, development, buildTarget, extractLicenses, namedChunks, optimization, sourceMap, builder (+2 more)

### Community 110 - "Blob Viewer Page Component"
Cohesion: 0.24
Nodes (3): Input, BlobViewerComponent, Component

### Community 111 - "Guard Page Component"
Cohesion: 0.29
Nodes (4): routes, AuthGuard, PageNotFoundComponent, Component

### Community 112 - "Notification API Client"
Cohesion: 0.29
Nodes (6): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, MarkAsReadDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NotificationStatsDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 115 - "Overdue Fees Page Component"
Cohesion: 0.22
Nodes (3): OverdueFeesComponent, MOCK_FEES, Component

### Community 116 - "Angular CLI Schematics Config"
Cohesion: 0.22
Nodes (9): prefix, projectType, root, schematics, sourceRoot, erp, style, type (+1 more)

### Community 117 - "Project Docs & Conventions"
Cohesion: 0.28
Nodes (9): Module Structure: standalone AppConfig root bootstrap + SystemModule (NgModule) lazy-loaded child routes, Page Structure Pattern: list component + create-x/ subfolder + update-x/ subfolder, accounts-payable.component.html — Accounts Payable List Page, create-accounts-payable.component.html — Create Accounts Payable Form, pay-accounts-payable.component.html — Pay Accounts Payable Form, accounts-receivable.component.html — Accounts Receivable List Page, create-accounts-receivable.component.html — Create Accounts Receivable Form, payment-with-money.component.html — Register Cash Payment Form (+1 more)

### Community 118 - "Admin Student API Client"
Cohesion: 0.28
Nodes (5): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, AdminStudentServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, BirthdayGreetingsResultDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 119 - "Graduations API Client"
Cohesion: 0.28
Nodes (4): ShowGraduationDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowGraduationDTOPaginatedResult, UpdateGraduationDTO

### Community 120 - "Public Contract API Client"
Cohesion: 0.25
Nodes (4): PublicContractService, Inject, Injectable, Optional

### Community 121 - "Public Student API Client"
Cohesion: 0.25
Nodes (4): PublicStudentService, Inject, Injectable, Optional

### Community 122 - "Transaction Category API Client"
Cohesion: 0.25
Nodes (4): TransactionCategoryService, Inject, Injectable, Optional

### Community 123 - "Generated API Client Layer"
Cohesion: 0.33
Nodes (6): BarChartDataDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, Series, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, SeriesDataInner

### Community 125 - "Frequencies Belt Distribution Page Component"
Cohesion: 0.33
Nodes (3): FrequenciesBeltDistributionComponent, Component, ViewChild

### Community 126 - "Angular Build Targets"
Cohesion: 0.25
Nodes (8): build, builder, configurations, defaultConfiguration, production, budgets, buildTarget, outputHashing

### Community 127 - "Project Docs & Conventions"
Cohesion: 0.29
Nodes (8): Create/Update Dialog Pattern: parent owns openedCreate/selected signals; child emits itemCreated/closeEvent; parent wraps child in Bootstrap modal, PaginationComponent (app-pagination), Dialogs (modals) pattern: parent Bootstrap modal wrapper + child form-only component, PaginationComponent (app-pagination) usage pattern, academies.component.html — Academies List Page, create-academy.component.html — Create Academy Form, update-academy.component.html — Update Academy Form (incl. address fields), academy-profile.component.html — Academy Self-Service Profile Settings Form

### Community 128 - "Address API Client"
Cohesion: 0.29
Nodes (4): AddressService, Inject, Injectable, Optional

### Community 129 - "Admin Notification API Client"
Cohesion: 0.29
Nodes (4): AdminNotificationService, Inject, Injectable, Optional

### Community 130 - "Admin Student API Client"
Cohesion: 0.29
Nodes (4): AdminStudentService, Inject, Injectable, Optional

### Community 131 - "Asaas Webhook API Client"
Cohesion: 0.29
Nodes (4): AsaasWebhookService, Inject, Injectable, Optional

### Community 132 - "Payment Webhook API Client"
Cohesion: 0.29
Nodes (4): PaymentWebhookService, Inject, Injectable, Optional

### Community 133 - "Generated API Client Layer"
Cohesion: 0.25
Nodes (7): DataFormat, DataType, ParamLocation, ParamStyle, StandardDataFormat, StandardDataType, StandardParamStyle

### Community 136 - "Avg Belts By Class Page Component"
Cohesion: 0.32
Nodes (4): AvgBeltsByClassComponent, Component, AvgStudentsByBeltComponent, Component

### Community 138 - "Angular Workspace Config"
Cohesion: 0.29
Nodes (6): analytics, cli, newProjectRoot, projects, $schema, version

### Community 139 - "Angular Build Configuration"
Cohesion: 0.29
Nodes (7): extract-i18n, test, architect, builder, options, buildTarget, builder

### Community 140 - "Address API Client"
Cohesion: 0.33
Nodes (4): AddressServiceInterface, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, AddressFromApiDTO, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 141 - "Medical Clearance API Client"
Cohesion: 0.38
Nodes (4): MedicalClearanceAttachmentResponseDto, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, MedicalClearanceAttachmentResponseDtoSize, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 146 - "Project Docs & Conventions"
Cohesion: 0.33
Nodes (6): Angular CLI (ng), Project Scaffolding Notes (CHANGELOG.md), CarlsonGracieAdm.esproj Project File, karma.conf.js (unit test config), launch.json (debugging config), CarlsonGracieAdm.esproj.FileListAbsolute.txt (build cache file list)

### Community 147 - "Generated API Client Layer"
Cohesion: 0.40
Nodes (4): ApiAdminAcademiesIdGet404Response, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, HttpValidationProblemDetails, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…

### Community 149 - "Accounts Receivable Module"
Cohesion: 0.33
Nodes (4): MOCK_CATEGORIES, MOCK_CATEGORY_RESPONSE, MOCK_ITEM, MOCK_ITEMS

### Community 152 - "Project Docs & Conventions"
Cohesion: 0.60
Nodes (5): Two Backends Architecture: api1 main (localhost:8080) + api2 face recognition (localhost:8003), API Generation: generate:api1 / generate:api2 / generate:all regenerate generated_services/, OpenAPI Generator (typescript-angular), generated_services/api2/README.md — Generated Angular API Client (api2 face recognition, OpenAPI doc 1.0.0), generated_services/README.md — Generated Angular API Client (api1, OpenAPI doc v1)

### Community 153 - "OpenAPI Generator Config"
Cohesion: 0.40
Nodes (4): generator-cli, version, $schema, spaces

### Community 156 - "Generated API Client Layer"
Cohesion: 0.50
Nodes (3): NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, NOTE: This class is auto generated by OpenAPI Generator (https://openapi-…, ShowNotificationStudentDto

### Community 157 - "Academies Module"
Cohesion: 0.40
Nodes (3): MOCK_ACADEMY_1, MOCK_ACADEMY_2, MOCK_ITEMS

### Community 161 - "Assets Module"
Cohesion: 0.83
Nodes (4): Dark Sidebar Navigation Admin Layout Pattern, Ecommerce Dashboard UI Layout (revenue chart, sales-by-country map, traffic source, recent sales), Steex Admin Dashboard Template, Screenshot: Steex Ecommerce Admin Dashboard

### Community 162 - "App Module"
Cohesion: 0.50
Nodes (4): app-confirm-dialog (global confirmation dialog host), app.component.html — Root Template (router-outlet + confirm dialog host), page-not-found.component.html — 404 Page, src/index.html — App Entry Point (title: RX Jiu-Jitsu)

### Community 167 - "Interface Module"
Cohesion: 0.50
Nodes (3): Login, ResetPassword, SendLogin

## Ambiguous Edges - Review These
- `README.md — Jiu-Admin Project Overview` → `src/index.html — App Entry Point (title: RX Jiu-Jitsu)`  [AMBIGUOUS]
  src/index.html · relation: conceptually_related_to
- `UI Components Decision: PrimeNG 19 LTS (p-table, p-dialog, p-select/inputtext/button, p-paginator, p-toast+MessageService)` → `UI Convention: Bootstrap 5 + ng-bootstrap (table, modal, btn, badge, select, input, spinner, alert)`  [AMBIGUOUS]
  .github/copilot-instructions.md · relation: conceptually_related_to
- `Reference to '.github/skills.md' for full component guidelines` → `angular_skills SKILL.md — Copilot Skills & Coding Guidelines`  [AMBIGUOUS]
  .github/copilot-instructions.md · relation: references

## Knowledge Gaps
- **280 isolated node(s):** `$schema`, `version`, `newProjectRoot`, `projectType`, `style` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **100 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `README.md — Jiu-Admin Project Overview` and `src/index.html — App Entry Point (title: RX Jiu-Jitsu)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `UI Components Decision: PrimeNG 19 LTS (p-table, p-dialog, p-select/inputtext/button, p-paginator, p-toast+MessageService)` and `UI Convention: Bootstrap 5 + ng-bootstrap (table, modal, btn, badge, select, input, spinner, alert)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Reference to '.github/skills.md' for full component guidelines` and `angular_skills SKILL.md — Copilot Skills & Coding Guidelines`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `Configuration` connect `Admin Contract API Client` to `Address API Client`, `Graduation Requirements API Client`, `Academy API Client`, `Admin Notification API Client`, `Admin Student API Client`, `Asaas Webhook API Client`, `Lessons API Client`, `Lesson Schedules API Client`, `Frequencies API Client`, `Payment Webhook API Client`, `Dashboard API Client`, `Responsible Form API Client`, `Address API Client`, `Notices API Client`, `Accounts Receivable API Client`, `Suppliers API Client`, `Accounts Payable API Client`, `Belts API Client`, `Tenant Settings API Client`, `App API Client`, `Students API Client`, `Student Onboarding API Client`, `Financial Summary API Client`, `Individual Persons API Client`, `Generated API Client Layer`, `Contract API Client`, `Dashboard API Client`, `Generated API Client Layer`, `Generated API Client Layer`, `Public API Client`, `Scheduled Jobs API Client`, `Generated API Client Layer`, `Academy API Client`, `Admin Accounts Receivable API Client`, `Company Persons API Client`, `Notification API Client`, `Scheduled Job API Client`, `Medical Clearance API Client`, `Accounts Receivable API Client`, `Contract Terms Templates API Client`, `Frequency API Client`, `Graduation API Client`, `My Academy API Client`, `Create Contract API Client`, `Health API Client`, `Contract API Client`, `Contract API Client`, `Medical Clearance API Client`, `Academy API Client`, `Admin Contract API Client`, `Admin Monthly Fee API Client`, `Notification API Client`, `Admin Student API Client`, `Public Contract API Client`, `Public Student API Client`, `Transaction Category API Client`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `ApiFrequencyGetPageParameter` connect `Graduation Requirements API Client` to `Academy API Client`, `Responsible Form API Client`, `Lessons API Client`, `Lesson Schedules API Client`, `Frequencies API Client`, `Admin Contract API Client`, `Dashboard API Client`, `Notices API Client`, `Accounts Receivable API Client`, `Accounts Payable API Client`, `Belts API Client`, `Student Onboarding API Client`, `Individual Persons API Client`, `Student Onboarding DTOs & Models`, `Contract API Client`, `Scheduled Jobs API Client`, `Contracts DTOs & Models`, `Medical Clearances API Client`, `Academy API Client`, `Admin Accounts Receivable API Client`, `Notification API Client`, `Notification API Client`, `Scheduled Job API Client`, `Belts API Client`, `Medical Clearance API Client`, `Accounts Receivable API Client`, `Contract Terms Templates API Client`, `Frequency API Client`, `Graduation API Client`, `Create Contract API Client`, `Contract API Client`, `Contract API Client`, `Medical Clearance API Client`, `Academy API Client`, `Medical Clearance API Client`, `Notification API Client`, `Admin Student API Client`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `extractErrorMessage()` connect `Create Belt Page Component` to `Academies Page Component`, `Responsible Form API Client`, `Academy Profile Page Component`, `Lesson Schedules API Client`, `Frequencies API Client`, `Lessons API Client`, `Detail Student Page Component`, `Notices API Client`, `Create Academy Page Component`, `Create Graduation Requirement Page Component`, `Create Frequency Page Component`, `Update Graduation Requirement Page Component`, `Update Student Page Component`, `Suppliers API Client`, `Pay Accounts Payable Page Component`, `Payment With Money Page Component`, `Update Belt Page Component`, `Update Supplier DTOs & Models`, `Create Contract Terms Template Page Component`, `Update Contract Page Component`, `Accounts Receivable DTOs & Models`, `Update Fee Plan Page Component`, `Update Notice Page Component`, `Student Onboarding DTOs & Models`, `Face Recognition DTOs & Models`, `Scheduled Jobs API Client`, `Address Form DTOs & Models`, `Contracts DTOs & Models`, `Students Page Component`, `Create Contract Page Component`, `Face Recognition Page Component`, `Create Supplier Page Component`, `Create Notification API Client`, `Update Academy DTOs & Models`, `Accounts Payable Page Component`, `Create Medical Clearance Page Component`, `Notification Page Component`, `Update Notification Page Component`, `Update Contract Terms Template DTOs & Models`, `Academies Page Component`, `Contract Terms Templates Page Component`, `Fee Plans Page Component`, `Medical Clearances Page Component`, `Payment Settings Page Component`, `Contract Versions API Client`, `Create Accounts Payable Page Component`, `Create Accounts Receivable Page Component`, `Belts Page Component`, `Graduation Requirements Page Component`, `Graduations Page Component`, `Transaction Categories Page Component`, `Create Graduation Page Component`, `Update Graduation Page Component`, `Update Persons Page Component`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `newProjectRoot` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._