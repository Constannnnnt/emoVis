import Api from '@/services/Api'

export default {
  toneAnalyze (params) {
    return Api().post('/api/tone', params)
  }
}
