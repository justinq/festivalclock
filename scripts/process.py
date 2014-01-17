#!/usr/bin/python
# coding=utf-8

'''
 Copyright (c) 2011 Justin Quillinan - http://justinq.net
 GPL version 3 or later (see http://www.gnu.org/copyleft/gpl.html)
'''

'''
Formats the raw festival data.
'''

import sys
import time
import json
import datetime
import math
from festivalsapi import FestivalsAPI

data = None;
genres = None;
clocktypes = ['min_price']

ringcategories = {
            'min_price' : {
                'num' : [0.01, 1.00, 2.00, 3.00, 4.00, 5.00, 6.00, 7.00, 8.00, 9.00, 10.00, 20.00, 999999999],
                'str' : [
                    'a:Free',
                    'b:From free to £1',
                    'c:From £1 to £2',
                    'd:From £2 to £3',
                    'e:From £3 to £4',
                    'f:From £4 to £5',
                    'g:From £5 to £6',
                    'h:From £6 to £7',
                    'i:From £7 to £8',
                    'j:From £8 to £9',
                    'k:From £9 to £10',
                    'l:From £10 to £20',
                    'm:Over £20'
                ],
            }
        }

with open('data/stats.json', 'r') as f:
   data = json.load(f)
   genres = data['genres']

def deleteFields(e, fs):
    for f in fs:
        if f in e.keys(): del e[f]

def compareGenre(a, b):
    return cmp(genres.index(a['genre']),genres.index(b['genre']))

'''
    Split a list of dictionaries into a list of lists by a particular field
'''
def splitByField(ds, f):
    cs = {}
    for d in ds:
        try: cs[ d[f] ].append(d)
        except KeyError: cs[ d[f] ] = [d] 
    sorted_cs = []
    sorted_ks = sorted(cs.iterkeys())
    for k in sorted_ks:
        sorted_cs.append( cs[k] )
    return sorted_ks, sorted_cs

def compressCategories(keys, categories, new_groups):
    new_categories = []
    new_keys       = []
    lower_limit = -999999999;
    for i in range( len(new_groups['num']) ):
        upper_limit = new_groups['num'][i]
        #print '    ',lower_limit, upper_limit
        new_category = []
        for j in range( len(keys) ):
            if  lower_limit <= keys[j] < upper_limit:
                #print '        ',keys[j],len(categories[j])
                new_category += categories[j]
        if len(new_category)>0:
            new_keys.append(new_groups['str'][i])
            new_categories.append(new_category)
        lower_limit = upper_limit

    return new_keys, new_categories

'''
    Get minimum seat price
    Change performance times to ms since epoch (for js) and concatenate
'''
def compressPerformances(e):
    e['min_price'] = None
    ps = {}
    for p in e['performances']:
        if e['min_price']==None or p['price']<e['min_price']:
            e['min_price'] = p['price']
        # change the time to epoch milliseconds and swap k, v
        starttime = time.strptime(p['start'], "%Y-%m-%d %H:%M:%S")
        endtime   = time.strptime(p['end'], "%Y-%m-%d %H:%M:%S")
        p[ int(time.mktime( starttime ))*1000 ] = 1 
        p[ int(time.mktime( endtime ))*1000   ] = 0 
        deleteFields(p,['concession','concession_additional','concession_family','title','price','start','end'])
        ps.update(p)
    e['performances'] = ps

for clocktype in clocktypes:
    for festival in FestivalsAPI.FESTIVALS:
        with open('data/raw/'+festival+'.json','r') as f:
            raw_data = json.load(f)
            shows = []
            for e in raw_data:
                e['genre'] = e['genre'].lower()
                # stupid hacking
                if e['genre']=='comission,visual arts':
                    e['genre'] = 'commission, visual arts'
                # Strip out the extraneous fields
                deleteFields(e, ['festival','festival_id','updated','url','performers_number','twitter','warnings','age_category','artist_type','country','disabled','discounts','fringe_first','non_english','performance_space','sub_venue'])
                # Additional ones that I might need in future
                deleteFields(e, ['artist','code','description','title','website']);
                compressPerformances(e)

                if clocktype=='min_price':
                    deleteFields(e, ['latitude','longitude','venue'])
                elif clocktype=='location':
                    sys.exit(clocktype + ' is not done yet')
                else:
                    sys.exit(clocktype + ' is not done yet')

                # All tattoo shows are one event, listed as separate events
                if festival=='tattoo':
                    try: shows[0]['performances'].update(e['performances'])
                    except IndexError: shows.append(e)
                else:
                    shows.append(e)

            # sort into categories
            print festival
            ks, cs = splitByField(shows, clocktype)
            # compress the categories
            ks, cs = compressCategories(ks, cs, ringcategories[clocktype])
            # Order shows by genre
            for item in cs:
                item.sort(compareGenre)
            # turn into dictionary
            categories = {}
            for i in range( len(ks) ):
                categories.update( { str(ks[i]) : cs[i] } )
                print '    ', ks[i],' : ',len(cs[i])
    
            data['shows'][festival] = categories
    
    # Print json to file
    with open('../'+clocktype+'.json','w') as f:
        json.dump(data, f, sort_keys=True)
    print json.dumps(data, sort_keys=True, indent=4)
