'''
 * Original PHP version Copyright (c) 2011, Web Species Ltd
 * Python version Copyright (c) 2011, Justin Quillinan - http://justinq.net
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Web Species Ltd nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL COPYRIGHT HOLDER BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *
'''

import hmac
import hashlib
import pycurl
import StringIO

'''
 * Festivals API
'''
class FestivalsAPI(object):
    FORMAT_JSON = 'application/json'
    FORMAT_ATOM = 'application/atom+xml'
    FORMAT_IVES = 'application/vnd.ives+xml'

    BASE_URL    = 'http://api.festivalslab.com'
    FESTIVALS   = ['art','book','fringe','international','jazz','mela','tattoo']

    '''
     * Access key
     *
     * @var string
    '''
    __key = ''

    '''
     * Secret key
     *
     * @var string
    '''
    __secret = ''

    '''
     * Is debugging enabled?
     *
     * @var bool
    '''
    __debug = False

    '''
     * @param string $key
     * @param string $secret
     * @param bool $debug
    '''
    def __init__(self, key, secret, debug = False):
        self.__key = key
        self.__secret = secret
        self.__debug = debug

    '''
     * Get event by id
     *
     * @param string $id
     * @param string $format
     * @return string
    '''
    def getEvent(self, event_id, response_format = FORMAT_JSON):
        return self.__request('/events/' + str(event_id), response_format)

    '''
     * Get array of events
     *
     * @param array $query
     * @param string $format
     * @return string
    '''
    def getEvents(self, query={}, response_format=FORMAT_JSON):
        params = 'pretty=1&' if (self.__debug) else '';
        for key, value in query.items():
            params += str(key)+'='+str(value)+'&';
        params = params.rstrip('&');
        return self.__request('/events?' + params, response_format);

    '''
     * Execute HTTP request
     *
     * @param string $url
     * @param string $format
     * @return string
    '''
    def __request(self, url, response_format):
        curl_handle = pycurl.Curl()
        buff = StringIO.StringIO();
 
        headers = ['Accept: ' + response_format]

        full_url = self.BASE_URL + self.__getSignedUrl(url)

        curl_handle.setopt(curl_handle.HTTPHEADER, headers)
        curl_handle.setopt(curl_handle.URL, full_url)
        curl_handle.setopt(curl_handle.WRITEFUNCTION, buff.write)

        curl_handle.perform()
        curl_handle.close()

        return buff.getvalue();

    '''
     * Calculate URL signature and append it to the URL
     *
     * @param string $url
     * @return string
    '''
    def __getSignedUrl(self, url):
        url += ('&' if '?' in url else '?') + 'key=' + self.__key
        url += '&signature=' + self.__getSignature(url)
        return url

    '''
     * Get signature for $data string
     *
     * @param string $data
     * @return string
    '''
    def __getSignature(self, data):
        return hmac.new(self.__secret, data, hashlib.sha1).hexdigest()
