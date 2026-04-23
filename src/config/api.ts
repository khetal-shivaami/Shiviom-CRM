// const API_BASE_URL = 'http://127.0.0.1:8000/';
// const API_BASE_URL = 'https://portal-api.shiviom.com/';
const API_BASE_URL = 'https://resellers-api.shiviom.com';

export const API_ENDPOINTS = {
  // Subscriptions
  GET_RESELLER_DATA: `${API_BASE_URL}/get_crm_reseller_list/`,
  VERIFY_RESELLER_ACCOUNT_FRM_CRM: `${API_BASE_URL}/verify_reseller_account_frm_crm/`,
  GET_CUSTOMER_LIST_OF_RESELLER_CRM: `${API_BASE_URL}/get_customer_list_of_reseller_crm/`,
  GET_RESELLER_DOMAIN_SUBSCRIPTIONDETAILS: `${API_BASE_URL}/get_reseller_domain_subscriptiondetails/`,
  GET_RESELLER_KYC_DETAILS_CRM: `${API_BASE_URL}/get_reseller_kyc_details_crm/`,
  VERIFY_KYC_DETAILS: `${API_BASE_URL}/verify_kyc_details_oncrm/`,
  SEND_CRM_ADMIN_CREDENTIALS: `${API_BASE_URL}/send_crm_admin_credentials/`,
  CREATE_USER_ON_CRM: `${API_BASE_URL}/create_user_on_crm/`,
  GET_RESELLER_CUSTOEMRS_LIST_ONCRM: `${API_BASE_URL}/get_resellers_customers_lists_oncrm/`,

  MAP_CUSTOMER_PARTNER_ONCRM: `${API_BASE_URL}/map_customer_partner_oncrm/`,
  UPLOAD_PARTNER_DOCUMENT_CRM: `${API_BASE_URL}/upload_partner_document_crm/`,
  GET_DOCS_ON_CRM: `${API_BASE_URL}/get_docs_on_crm/`,
  GET_RESELLER_CASES_LIST_ONCRM: `${API_BASE_URL}/get_reseller_cases_list_oncrm/`,
  UPDATE_CASESTATUS_ONCRM: `${API_BASE_URL}/update_casestatus_oncrm/`,
  ADD_RESELLER_DISCOUNT_ONCRM: `${API_BASE_URL}/add_reseller_discount_oncrm/`,
  GET_RESELLER_DISCOUNT_LIST_ONCRM: `${API_BASE_URL}/get_reseller_discount_list_oncrm/`,
  UPDATE_RESELLER_PARTNERPROGRAM_ONCRM: `${API_BASE_URL}/update_reseller_partnerprogram_oncrm/`,
  GET_CUSTOMER_QUOTATION_LIST_ONCRM: `${API_BASE_URL}/get_customer_quotation_list_oncrm/`,
  UPDATE_QUOTATION_STATUS_ONCRM: `${API_BASE_URL}/update_quotation_status_oncrm/`,
  GET_SKUPRICE_ONCRM: `${API_BASE_URL}/get_skuprice_oncrm/`,
  GET_PRODUCT_DATA_ONCRM: `${API_BASE_URL}/get_products_data_oncrm/`,
  GET_CUSTOMER_CONDITIONS_ONCRM: `${API_BASE_URL}/get_customer_conditions_oncrm/`,
  GET_RESELLER_CONDITIONS_ONCRM: `${API_BASE_URL}/get_reseller_conditions_oncrm/`,
  GET_ACCOUNT_MGR_NAMES_ONCRM: `${API_BASE_URL}/get_account_mgr_names_oncrm/`,
  UPDATE_RESELLER_ACCOUNTMANAGER_ONCRM: `${API_BASE_URL}/update_reseller_accountmanager_oncrm/`,
  GET_ALLQUOTATION_ONCRM: `${API_BASE_URL}/get_allquotation_oncrm/`,
  SEND_QUOTATION_BYADMIN_ONCRM: `${API_BASE_URL}/send_quotation_byadmin_oncrm/`,
  STORE_INSERT_CRM_LOGS: `${API_BASE_URL}/store_insert_crm_logs/`,
  GET_RENEWAL_CRMDATA: `${API_BASE_URL}/get_renewal_crmdata/`,  
  GET_RESELLERRENEWAL_DETAILS: `${API_BASE_URL}/get_resellerrenewal_details/`,  
  REGISTER_CASE_ONCRM: `${API_BASE_URL}/register_case_oncrm/`,
  SEND_RESELLER_LOGIN_DETAILS: `${API_BASE_URL}/send_reseller_login_details/`, 
  GET_EXISTING_RESELLERLOGIN_INVITATION_DETAILS: `${API_BASE_URL}/get_existing_resellerlogin_invitation_details/`,  
  SEND_RESELLER_ACCOUNT_DOCUMENTS: `${API_BASE_URL}/send_reseller_account_documents/`,  
  STORE_PRODUCTWISE_DISCOUNT_ONCRM: `${API_BASE_URL}/store_productwise_discount_oncrm/`, 
  GET_PRODUCTWISE_DISCOUNT_ONCRM: `${API_BASE_URL}/get_productwise_discount_oncrm/`,  
  GET_PRODUCT_CATEGORYWISE_DETAILS_ONCRM: `${API_BASE_URL}/get_product_categorywise_details_oncrm/`,  
  GET_USER_LEVEL_LOGS_ONCRM: `${API_BASE_URL}/get_user_level_logs_oncrm/`, 
  SEND_RENEWAL_NOTIFICATION_FRMCRM: `${API_BASE_URL}/send_renewal_notification_frmcrm/`,  
  MAP_SINGLE_CUSTOMER_TO_RESELLER_ONCRM: `${API_BASE_URL}/map_single_customer_to_reseller_oncrm/`,  
  GET_DOMAIN_LICENCE_ADDED_HISTORY: `${API_BASE_URL}/get_domain_licence_added_history/`,  
  GET_INVOICE_HISTORY_ONCRM: `${API_BASE_URL}/get_invoice_history_oncrm/`,  

  GET_DOMAIN_RENEWAL_HISTORY : `${API_BASE_URL}/get_domain_renewal_history/`,  
  SEND_TASK_NOTIFICATION_FRMCRM : `${API_BASE_URL}/send_task_notification_frmcrm/`, 
  
  PRODUCT_DOCUMENTATION_UPLOAD : `${API_BASE_URL}/product_documentation_upload/`, 
  GET_KNOWLEDGEBASE_DOCS : `${API_BASE_URL}/get_knowledgebase_docs/`, 
  SHARE_KNOWLEDGEBASE_DOCS_PARTNER_CRM : `${API_BASE_URL}/share_knowledgebase_docs_partner_crm/`, 
  DELETE_KNOWLEDGEBASE_DOCS : `${API_BASE_URL}/delete_knowledgebase_doc/`, 


  // This endpoint is duplicated, keeping one for consistency with the component's usage
  GET_PRODUCTS_DATA_ONCRM : `${API_BASE_URL}/get_products_data_oncrm/`, 
  STORE_SKUWISE_DISCOUNT_ONCRM : `${API_BASE_URL}/store_skuwise_discount_oncrm/`, 
  GET_SKUWISE_DISCOUNT_ONCRM : `${API_BASE_URL}/get_skuwise_discount_oncrm/`,
  SEND_BULK_RENEWAL_NOTIFICATION_FRMCRM : `${API_BASE_URL}/send_bulk_renewal_notification_frmcrm/`, 
  STORE_PARTNER_DOMAIN_ONCRM : `${API_BASE_URL}/store_partner_domain_oncrm/`, 
  GET_ALL_LOGS_DETAILS_ONCRM : `${API_BASE_URL}/get_all_logs_details_oncrm/`, 

  GET_DOMAIN_LIST_OF_RESELLER_ADDLICENSE_ONCRM : `${API_BASE_URL}/get_domain_list_of_reseller_addlicense_oncrm/`, 
  GET_DOMAIN_OF_RESELLER_ADDLICENSE_ONCRM : `${API_BASE_URL}/get_domain_of_reseller_addlicense_oncrm/`, 
  ADDGOOGLELICENSE_ONCRM : `${API_BASE_URL}/addGoogleLicense_oncrm/`, 


  GET_OEM_LIST_ONCRM : `${API_BASE_URL}/get_oem_list_oncrm/`, 
  GET_PRODUCT_LIST_ONCRM : `${API_BASE_URL}/get_product_list_oncrm/`, 
  CERATE_NEW_PRODUCT_DETAILS_ONCRM : `${API_BASE_URL}/create_new_product_details_oncrm/`, 
  GET_OEM_DETAILS : `${API_BASE_URL}/get_oem_details/`,
  UPDATE_OEM_DETAILS_ONCRM : `${API_BASE_URL}/update_oem_details_oncrm/`,
  INSERT_INTO_SKU_DETAILS_ONCRM : `${API_BASE_URL}/insert_new_sku_details_oncrm/`,
  UPDATE_SKU_DETAILS_ONCRM : `${API_BASE_URL}/update_sku_details_oncrm/`,
  CREATE_NEW_PRODUCT_ONCRM : `${API_BASE_URL}/create_new_product_oncrm/`,

  INSERT_CRM_PARTNER_DETAILS : `${API_BASE_URL}/insert_crm_partner_details/`,
  UPDATE_RESELLER_DETAILS_ONCRM : `${API_BASE_URL}/update_reseller_details_oncrm/`,
  INSERT_CRM_PARTNER_DETAILSWTHCUSTOMER : `${API_BASE_URL}/insert_crm_partner_detailswthcustomer/`,
  

};
