# Simulated Disaster Demo Data

Use synthetic data only. Do not add real people, real beneficiary records, secrets, or sensitive operational data.

## demo_needs_assessment.csv

```csv
assessment_id,assessment_date,admin_pcode,district_name,partner_org,site_type,people_assessed,households_assessed,priority_need,need_severity_score,response_gap_percent,latitude,longitude,notes
A001,2026-06-01,ADM001,North District,Partner A,Host community,642,118,Water,78,46,18.42,-72.32,Road access limited
A002,2026-06-02,ADM002,Central District,Partner B,Collective center,792,144,Shelter,74,41,18.51,-72.21,High shelter damage
A003,2026-06-03,ADM003,South District,Partner A,Host community,534,102,Health,51,18,18.31,-72.41,
A004,2026-06-04,ADM004,East District,Partner C,Informal site,350,64,Shelter,70,40,18.47,-72.12,Informal site
A005,2026-06-05,ADM005,West District,Partner B,Collective center,690,126,Water,77,,18.37,-72.54,Response gap unknown
```

## demo_population_baseline.csv

```csv
admin_code,admin_name,total_population,children_under_18,older_adults,poverty_rate
ADM001,North District,24500,9800,2100,38
ADM002,Central District,31000,11200,2800,34
ADM003,South District,18750,7600,1900,41
ADM004,East District,15400,5900,1200,47
ADM006,Lakeside District,17650,6900,1600,39
```

## demo_service_capacity.csv

```csv
district_id,district_name,health_facility_count,evacuation_center_count,current_staff_capacity,market_functionality_score
ADM001,North District,5,7,42,58
ADM002,Central District,8,9,61,74
ADM003,South District,4,4,33,63
ADM004,East District,3,5,,46
ADM005,West District,5,6,37,61
```
