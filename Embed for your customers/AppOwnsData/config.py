# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.

class BaseConfig(object):

    # Can be set to 'MasterUser' or 'ServicePrincipal'
    AUTHENTICATION_MODE = 'ServicePrincipal'

    # Workspace Id in which the report is present
    WORKSPACE_ID = '7e144ef3-a568-41bb-aa8d-7b2c103b4667'
    
    # Report Id for which Embed token needs to be generated
    REPORT_ID = '26f1b7f9-8ee2-4aed-89fe-856dd24c9fca'
    # REPORT_ID = '1f4e9c16-ac12-4bb2-aade-5467c89526c3'
    
    # Id of the Azure tenant in which AAD app and Power BI report is hosted. Required only for ServicePrincipal authentication mode.
    TENANT_ID = 'eb050007-cd7f-48f7-a813-59c15ec7310f'
    
    # Client Id (Application Id) of the AAD app
    CLIENT_ID = '068dcde0-f8a8-4d4f-b2f6-cf52d39812c8'
    
    # Client Secret (App Secret) of the AAD app. Required only for ServicePrincipal authentication mode.
    CLIENT_SECRET = 'Xqj8Q~dE.FZ2Qh~f4xpcKu3tjN9Ux0Gb1RFu.ap3'
    
    # Scope Base of AAD app. Use the below configuration to use all the permissions provided in the AAD app through Azure portal.
    SCOPE_BASE = ['https://analysis.windows.net/powerbi/api/.default']
    
    # URL used for initiating authorization request
    AUTHORITY_URL = 'https://login.microsoftonline.com/organizations'
    
    # Master user email address. Required only for MasterUser authentication mode.
    POWER_BI_USER = ''
    
    # Master user email password. Required only for MasterUser authentication mode.
    POWER_BI_PASS = ''