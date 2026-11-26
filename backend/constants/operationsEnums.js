// Shared Enums for Vector Advert ERP — Physical Advertising & Signage Manufacturing (Sections 11-18)

export const ADVERTISING_PRODUCT_CATEGORY_ENUM = [
  'neon_light_custom',
  'backlit_lightbox',
  '3d_channel_letters_acrylic',
  '3d_metal_halo_lit',
  'pylon_totem_signage',
  'wayfinding_directional',
  'billboard_large_format',
  'vehicle_fleet_branding',
  'acrylic_custom_displays',
  'custom_architectural_fabrication'
];

export const LEAD_SOURCE_ENUM = [
  'walk_in',
  'direct_phone_call',
  'referral',
  'website_inquiry',
  'social_media_telegram',
  'social_media_facebook',
  'social_media_tiktok',
  'outdoor_advert_ad',
  'tender_bidding',
  'exhibition_trade_fair',
  'cold_outreach',
  'repeat_client'
];

export const LEAD_STATUS_ENUM = [
  'new',
  'contacted',
  'site_survey_scheduled',
  'measurement_taken',
  'estimation_in_progress',
  'quotation_sent',
  'negotiating',
  'won_converted',
  'lost',
  'disqualified'
];

export const CLIENT_TYPE_ENUM = [
  'corporate',
  'individual',
  'ngo',
  'government',
  'advertising_agency',
  'retailer_chain',
  'hospitality',
  'franchise'
];

export const INDUSTRY_ENUM = [
  'banking_finance',
  'hospitality_hotel_restaurant',
  'real_estate_construction',
  'telecommunications',
  'fmcg_beverage',
  'retail_supermarket',
  'healthcare_pharma',
  'automotive_dealership',
  'entertainment_nightlife',
  'education',
  'technology',
  'public_sector',
  'other'
];

export const FOLLOWUP_CHANNEL_ENUM = [
  'phone_call',
  'in_person_meeting',
  'site_survey_visit',
  'telegram_whatsapp',
  'email',
  'quotation_presentation',
  'workshop_tour',
  'payment_collection_visit'
];

export const FOLLOWUP_ACTION_TYPE_ENUM = [
  'call_back',
  'schedule_site_survey',
  'send_revised_quote',
  'send_material_samples',
  'send_3d_render_mockup',
  'follow_up_deposit',
  'collect_withholding_tax_receipt',
  'contract_signing',
  'post_installation_check'
];

export const FOLLOWUP_STATUS_ENUM = [
  'scheduled',
  'in_progress',
  'completed',
  'rescheduled',
  'cancelled',
  'missed'
];

// Section 12: Site Services
export const SITE_SERVICE_TYPE_ENUM = [
  'delivery_and_installation',
  'delivery_only',
  'on_site_maintenance_or_warranty'
];

export const SURVEY_STATUS_ENUM = [
  'draft',
  'scheduled',
  'in_progress',
  'completed',
  'rescheduled',
  'cancelled'
];

export const WALL_SURFACE_TYPE_ENUM = [
  'reinforced_concrete',
  'hollow_concrete_block_hcb',
  'brick_masonry',
  'glass_curtain_wall',
  'acp_aluminum_composite_cladding',
  'steel_i_beam_truss',
  'gypsum_drywall',
  'wood_composite'
];

export const INSTALLATION_ACCESS_TYPE_ENUM = [
  'ground_level',
  'standard_ladder',
  'scaffolding_tower',
  'boom_lift_cherry_picker',
  'mobile_crane',
  'rope_access_abseiling'
];

export const SITE_INSTALLATION_STATUS_ENUM = [
  'scheduled',
  'cargo_loaded_in_transit',
  'on_site_arrived_and_prep',
  'mounting_and_wiring_in_progress',
  'testing_illumination',
  'handover_signed',
  'rework_required',
  'cancelled'
];

export const HANDOVER_CONDITION_ENUM = [
  'accepted_flawless',
  'conditional_acceptance_minor_snags',
  'rejected_defective'
];

// Section 13: Client Order, Design & JobOrder
export const CLIENT_ORDER_STATUS_ENUM = [
  'draft',
  'in_design',
  'proof_under_client_review',
  'design_revision_requested',
  'design_agreed',
  'pending_financial_clearance',
  'production_authorized',
  'in_production',
  'completed',
  'cancelled'
];

export const FINANCIAL_CLEARANCE_STATUS_ENUM = [
  'pending_setup',
  'invoice_issued_pending_payment',
  'advance_deposit_cleared',
  'corporate_credit_approved',
  'fully_prepaid',
  'cleared_for_production'
];

export const JOB_ORDER_STATUS_ENUM = [
  'queued_for_materials',
  'materials_allocated',
  'in_machine_cutting',
  'in_assembly_and_wiring',
  'in_electrical_and_qc_testing',
  'ready_for_dispatch',
  'out_for_delivery_or_installation',
  'installation_completed',
  'closed'
];

export const JOB_PRIORITY_ENUM = [
  'low',
  'normal',
  'urgent',
  'rush_emergency'
];

export const DESIGN_TASK_STATUS_ENUM = [
  'assigned',
  'in_progress',
  'internal_review',
  'proof_submitted',
  'revision_requested',
  'client_approved',
  'production_files_exported'
];

export const PROOF_STATUS_ENUM = [
  'draft_internal',
  'submitted_to_client',
  'revision_requested',
  'approved_by_client',
  'superseded',
  'rejected'
];

export const REVISION_CATEGORY_ENUM = [
  'dimension_scaling',
  'color_adjustment',
  'font_typography',
  'illumination_lighting',
  'transformer_wiring_path',
  'structural_mounting'
];

export const APPROVAL_METHOD_ENUM = [
  'digital_signature_tablet',
  'signed_proof_sheet_pdf',
  'telegram_bot_approval',
  'official_email_confirmation',
  'in_person_verbal_witnessed'
];

// Section 14: Production & Machines
export const PRODUCTION_REQUEST_STATUS_ENUM = [
  'draft',
  'submitted_to_shopfloor',
  'machine_queued',
  'machine_in_progress',
  'machine_completed',
  'finishing_in_progress',
  'finishing_completed',
  'qc_cleared',
  'rework_required',
  'cancelled'
];

export const MACHINE_TYPE_ENUM = [
  'cnc_router_heavy',
  'co2_laser_cutter',
  'fiber_laser_metal_cutter',
  'channel_letter_auto_bender',
  'fiber_laser_spot_welder',
  'uv_flatbed_printer',
  'eco_solvent_roll_printer',
  'roll_laminator_cold_hot',
  'acrylic_strip_heat_bender'
];

export const MACHINE_OPERATION_STATUS_ENUM = [
  'idle_awaiting_job',
  'setup_and_calibration',
  'running_cutting',
  'paused_tool_change',
  'completed',
  'aborted_tool_breakage',
  'maintenance_hold'
];

export const FINISHING_OPERATION_TYPE_ENUM = [
  'silicone_neon_insertion',
  'led_module_injection_and_wiring',
  'acrylic_face_chemical_bonding',
  'metal_letter_return_welding',
  'standoff_stud_mounting',
  'transformer_potting_and_wiring',
  'aluminum_frame_tig_welding',
  'tension_fabric_keder_sewing',
  'flame_and_diamond_edge_polishing',
  'vinyl_application_and_masking'
];

export const FINISHING_TASK_STATUS_ENUM = [
  'pending_assignment',
  'assigned',
  'in_progress',
  'quality_hold',
  'completed',
  'rework_needed'
];

// Section 15: Invoices, Payments & Credit
export const INVOICE_TYPE_ENUM = ['proforma', 'tax_invoice'];

export const INVOICE_STATUS_ENUM = [
  'draft',
  'issued',
  'sent_to_client',
  'partially_paid',
  'fully_paid',
  'credit_settled',
  'cancelled',
  'bad_debt_write_off'
];

export const PAYMENT_METHOD_ENUM = [
  'bank_transfer_cbe',
  'bank_transfer_awash',
  'bank_transfer_other',
  'telebirr_merchant',
  'cbe_birr',
  'cheque_corporate',
  'cash_at_counter',
  'withholding_tax_voucher_2pct',
  'letter_of_credit_lc'
];

export const RECEIPT_TYPE_ENUM = [
  'advance_deposit_upfront',
  'interim_progress_payment',
  'final_balance_settlement',
  'credit_account_liquidation'
];

export const CUSTOMER_CREDIT_STATUS_ENUM = [
  'active_good_standing',
  'near_credit_limit',
  'overdue_grace_period',
  'credit_hold_locked',
  'legal_recovery'
];

export const AGING_BRACKET_ENUM = [
  'current_0_30_days',
  'overdue_31_60_days',
  'overdue_61_90_days',
  'critical_over_90_days'
];

// Section 16: Machinery Maintenance & Repair
export const MAINTENANCE_FREQUENCY_ENUM = [
  'daily_pre_shift',
  'daily_post_shift',
  'weekly',
  'monthly',
  'quarterly',
  'semi_annual',
  'annual_overhaul'
];

export const MAINTENANCE_TASK_CATEGORY_ENUM = [
  'cleaning_dust_removal',
  'lubrication_greasing',
  'calibration_alignment',
  'fluid_coolant_check',
  'optical_cleaning',
  'safety_interlock_test',
  'wear_part_inspection',
  'pneumatic_electrical_check'
];

export const REPAIR_URGENCY_ENUM = [
  'low_operational',
  'medium_degraded_performance',
  'high_urgent',
  'critical_production_halted'
];

export const MACHINE_FAILURE_CATEGORY_ENUM = [
  'spindle_bearing_and_vfd',
  'laser_optical_and_tube',
  'printhead_capping_subtank',
  'mechanical_drive_ballscrew',
  'pneumatic_air_solenoid',
  'electrical_sensor_driver',
  'cooling_chiller_compressor',
  'vacuum_bed_pump_clog'
];

export const REPAIR_STATUS_ENUM = [
  'reported_pending_diagnosis',
  'in_diagnosis',
  'waiting_for_spare_parts',
  'repair_in_progress',
  'testing_and_calibrating',
  'completed_certified',
  'scrapped_decommissioned'
];

// Section 17: Closed-Loop Scrap & Wastage
export const MANUFACTURING_STAGE_ENUM = [
  'cnc_router_cutting',
  'laser_cutting_engraving',
  'channel_letter_bending',
  'acrylic_face_bonding',
  'silicone_neon_insertion',
  'led_module_wiring',
  'qc_burn_in_testing',
  'material_handling_storage'
];

export const PRODUCTION_SCRAP_CATEGORY_ENUM = [
  'unusable_skeleton_offcut',
  'reusable_offcut_salvaged',
  'machine_malfunction_ruin',
  'operator_handling_mistake',
  'component_factory_defect',
  'qc_quality_rejection'
];

export const SCRAP_COST_ALLOCATION_ENUM = [
  'absorb_in_job_order_cost',
  'factory_overhead_scrap_loss',
  'charge_to_operator_investigation'
];

// Section 18: Post-Sales Feedback, Complaints & Warranty
export const FEEDBACK_CHANNEL_ENUM = [
  'phone_interview',
  'telegram_bot_prompt',
  'in_person_handover',
  'qr_code_on_sign',
  'email_survey'
];

export const COMPLAINT_CATEGORY_ENUM = [
  'illumination_failure',
  'structural_physical_defect',
  'installation_workmanship',
  'design_non_conformance',
  'timeline_delivery_delay',
  'billing_financial_dispute'
];

export const COMPLAINT_SEVERITY_ENUM = [
  'low_minor_cosmetic',
  'medium_functional_glitch',
  'high_safety_or_electrical',
  'critical_brand_emergency'
];

export const COMPLAINT_RESOLUTION_STATUS_ENUM = [
  'logged_open',
  'investigating_diagnosing',
  'site_visit_scheduled',
  'corrective_action_in_progress',
  'resolved_pending_client_signoff',
  'closed_satisfied',
  'escalated_management'
];

export const WARRANTY_STATUS_ENUM = [
  'pending_activation',
  'active_under_warranty',
  'partially_expired',
  'expired',
  'voided'
];

export const WARRANTY_CLAIM_STATUS_ENUM = [
  'claim_submitted',
  'under_technical_review',
  'claim_approved',
  'parts_dispatched',
  'repaired_on_site',
  'claim_rejected',
  'closed'
];

export const CLAIM_COVERAGE_DETERMINATION_ENUM = [
  'approved_full_parts_and_labor',
  'approved_parts_only',
  'approved_labor_only',
  'rejected_out_of_warranty',
  'rejected_unauthorized_tampering',
  'rejected_force_majeure_or_vandalism'
];
